"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, RotateCcw, X } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Select } from "@/presentation/components/ui/select";
import { cn } from "@/lib/utils/cn";

/**
 * Composant générique de filtres avancés URL-synced.
 *
 * Conçu pour TOUS les modules du back-office. Chaque écran de liste
 * passe un *schéma déclaratif* (`fields`) ; le composant gère :
 *   • lecture/écriture des valeurs dans `useSearchParams` (URL canonique),
 *   • debounce sur les inputs texte (300 ms par défaut),
 *   • chips actives effaçables + bouton « Réinitialiser tout »,
 *   • callback `onApply(values)` pour relancer la requête côté page.
 *
 * Le composant **ne déclenche pas de fetch lui-même** : il met à jour
 * l'URL et appelle `onApply`. La page transforme `values` en query
 * params côté service → repository → API.
 */

// ── Schéma de filtre déclaratif ───────────────────────────────────────

export type FilterOption = { value: string; label: string };

export type FilterField =
  | {
      kind: "text";
      key: string;
      label: string;
      placeholder?: string;
      icon?: React.ReactNode;
    }
  | {
      kind: "select";
      key: string;
      label: string;
      options: FilterOption[];
      placeholder?: string;
    }
  | {
      /**
       * Multi-sélection : valeur stockée en CSV dans l'URL (`"a,b,c"`).
       * Rendue ici sous forme de chips toggleables.
       */
      kind: "multi";
      key: string;
      label: string;
      options: FilterOption[];
    }
  | {
      /**
       * Plage de dates. Stocke deux clés URL : `${key}_from`, `${key}_to`.
       */
      kind: "date-range";
      key: string;
      label: string;
    }
  | {
      /**
       * Plage numérique. Stocke `${key}_min`, `${key}_max`.
       */
      kind: "number-range";
      key: string;
      label: string;
      step?: number;
      unit?: string;
    }
  | {
      /** Booléen tri-état : non défini / oui / non, via "1" / "0". */
      kind: "boolean";
      key: string;
      label: string;
      trueLabel?: string;
      falseLabel?: string;
    };

/** Valeurs typées renvoyées par `onApply`. */
export type FilterValues = Record<string, string | string[] | undefined>;

interface AdvancedFiltersProps {
  fields: FilterField[];
  /** Callback appelé quand les filtres changent (debouncé pour le texte). */
  onApply?: (values: FilterValues) => void;
  /** Réinit les paginations à la 1ère page quand un filtre change. */
  onPageReset?: () => void;
  /** Délai debounce pour les inputs `text` (ms). */
  debounceMs?: number;
  /** Cacher la barre de filtres derrière un bouton « Filtres » repliable. */
  collapsible?: boolean;
}

const RANGE_FROM_SUFFIX = "_from";
const RANGE_TO_SUFFIX = "_to";
const MIN_SUFFIX = "_min";
const MAX_SUFFIX = "_max";

export function AdvancedFilters({
  fields,
  onApply,
  onPageReset,
  debounceMs = 300,
  collapsible = false,
}: AdvancedFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [open, setOpen] = useState(!collapsible);

  // ── Lecture initiale URL → values ───────────────────────────────
  const values = useMemo<FilterValues>(() => {
    const acc: FilterValues = {};
    for (const f of fields) {
      switch (f.kind) {
        case "text":
        case "select":
        case "boolean": {
          const v = searchParams.get(f.key);
          if (v != null) acc[f.key] = v;
          break;
        }
        case "multi": {
          const v = searchParams.get(f.key);
          if (v) acc[f.key] = v.split(",").filter(Boolean);
          break;
        }
        case "date-range": {
          const from = searchParams.get(f.key + RANGE_FROM_SUFFIX);
          const to = searchParams.get(f.key + RANGE_TO_SUFFIX);
          if (from) acc[f.key + RANGE_FROM_SUFFIX] = from;
          if (to) acc[f.key + RANGE_TO_SUFFIX] = to;
          break;
        }
        case "number-range": {
          const min = searchParams.get(f.key + MIN_SUFFIX);
          const max = searchParams.get(f.key + MAX_SUFFIX);
          if (min) acc[f.key + MIN_SUFFIX] = min;
          if (max) acc[f.key + MAX_SUFFIX] = max;
          break;
        }
      }
    }
    return acc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchParamsString, fields]);

  // ── Écriture : on remplace l'URL et on notifie l'écran ──────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const writeToUrl = useCallback(
    (key: string, raw: string | string[] | undefined, immediate = false) => {
      const params = new URLSearchParams(searchParams.toString());
      if (raw == null || raw === "" || (Array.isArray(raw) && raw.length === 0)) {
        params.delete(key);
      } else {
        params.set(key, Array.isArray(raw) ? raw.join(",") : raw);
      }
      // Reset pagination à chaque changement.
      params.delete("page");
      const queryString = params.toString();

      const url = queryString
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname;

      const commit = () => {
        router.replace(url, { scroll: false });
        onPageReset?.();
        if (onApply) {
          const next: FilterValues = {};
          params.forEach((v, k) => {
            // Détection multi : champs déclarés `multi`.
            const field = fields.find((f) => f.kind === "multi" && f.key === k);
            next[k] = field ? v.split(",").filter(Boolean) : v;
          });
          onApply(next);
        }
      };

      if (immediate) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        commit();
      } else {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(commit, debounceMs);
      }
    },
    [searchParams, router, fields, debounceMs, onApply, onPageReset],
  );

  // Premier render : notifie la page avec les valeurs initiales URL.
  const notifiedInitial = useRef(false);
  useEffect(() => {
    if (notifiedInitial.current) return;
    notifiedInitial.current = true;
    onApply?.(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetAll = () => {
    router.replace(window.location.pathname, { scroll: false });
    onPageReset?.();
    onApply?.({});
  };

  // ── Chips actives ──────────────────────────────────────────────
  const activeChips: { label: string; onClear: () => void }[] = [];

  const hasActive = activeChips.length > 0;

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        {/* Header : Filtres + bouton reset */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => collapsible && setOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2 text-sm font-medium",
              collapsible && "transition-colors hover:text-primary",
            )}
          >
            <Filter className="size-4" />
            Filtres
            {hasActive ? (
              <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                {activeChips.length}
              </span>
            ) : null}
          </button>
          {hasActive ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetAll}
              className="gap-2 text-xs"
            >
              <RotateCcw className="size-3.5" />
              Réinitialiser
            </Button>
          ) : null}
        </div>

        {/* Chips actives */}
        {hasActive ? (
          <div className="flex flex-wrap gap-2">
            {activeChips.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={c.onClear}
                className="group inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/15"
              >
                {c.label}
                <X className="size-3 transition-colors group-hover:text-danger" />
              </button>
            ))}
          </div>
        ) : null}

        {/* Champs de filtres */}
        {open ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => (
              <FieldRenderer
                key={field.key}
                field={field}
                values={values}
                onChange={writeToUrl}
              />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ── Rendu d'un champ ───────────────────────────────────────────────────

function FieldRenderer({
  field,
  values,
  onChange,
}: {
  field: FilterField;
  values: FilterValues;
  onChange: (
    key: string,
    raw: string | string[] | undefined,
    immediate?: boolean,
  ) => void;
}) {
  switch (field.kind) {
    case "text": {
      const v = (values[field.key] as string) ?? "";
      return (
        <div className="space-y-1.5">
          <Label htmlFor={`f-${field.key}`}>{field.label}</Label>
          <Input
            id={`f-${field.key}`}
            value={v}
            onChange={(e) =>
              onChange(field.key, e.target.value || undefined, false)
            }
            placeholder={field.placeholder}
          />
        </div>
      );
    }
    case "select": {
      const v = (values[field.key] as string) ?? "";
      return (
        <div className="space-y-1.5">
          <Label htmlFor={`f-${field.key}`}>{field.label}</Label>
          <Select
            id={`f-${field.key}`}
            value={v}
            onChange={(e) =>
              onChange(field.key, e.target.value || undefined, true)
            }
            options={[
              { value: "", label: field.placeholder ?? "Tous" },
              ...field.options,
            ]}
          />
        </div>
      );
    }
    case "multi": {
      const selected = (values[field.key] as string[] | undefined) ?? [];
      const toggle = (val: string) => {
        const next = selected.includes(val)
          ? selected.filter((x) => x !== val)
          : [...selected, val];
        onChange(field.key, next.length ? next : undefined, true);
      };
      return (
        <div className="space-y-1.5">
          <Label>{field.label}</Label>
          <div className="flex flex-wrap gap-1.5">
            {field.options.map((o) => {
              const active = selected.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted hover:border-primary hover:text-primary",
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    case "date-range": {
      const from = (values[field.key + RANGE_FROM_SUFFIX] as string) ?? "";
      const to = (values[field.key + RANGE_TO_SUFFIX] as string) ?? "";
      return (
        <div className="space-y-1.5">
          <Label>{field.label}</Label>
          <div className="grid grid-cols-2 gap-1.5">
            <Input
              type="date"
              value={from}
              onChange={(e) =>
                onChange(
                  field.key + RANGE_FROM_SUFFIX,
                  e.target.value || undefined,
                  true,
                )
              }
              aria-label={`${field.label} — début`}
            />
            <Input
              type="date"
              value={to}
              onChange={(e) =>
                onChange(
                  field.key + RANGE_TO_SUFFIX,
                  e.target.value || undefined,
                  true,
                )
              }
              aria-label={`${field.label} — fin`}
            />
          </div>
        </div>
      );
    }
    case "number-range": {
      const min = (values[field.key + MIN_SUFFIX] as string) ?? "";
      const max = (values[field.key + MAX_SUFFIX] as string) ?? "";
      return (
        <div className="space-y-1.5">
          <Label>
            {field.label}
            {field.unit ? (
              <span className="ml-1 text-xs text-muted">({field.unit})</span>
            ) : null}
          </Label>
          <div className="grid grid-cols-2 gap-1.5">
            <Input
              type="number"
              step={field.step}
              placeholder="Min"
              value={min}
              onChange={(e) =>
                onChange(field.key + MIN_SUFFIX, e.target.value || undefined)
              }
            />
            <Input
              type="number"
              step={field.step}
              placeholder="Max"
              value={max}
              onChange={(e) =>
                onChange(field.key + MAX_SUFFIX, e.target.value || undefined)
              }
            />
          </div>
        </div>
      );
    }
    case "boolean": {
      const v = (values[field.key] as string) ?? "";
      return (
        <div className="space-y-1.5">
          <Label htmlFor={`f-${field.key}`}>{field.label}</Label>
          <Select
            id={`f-${field.key}`}
            value={v}
            onChange={(e) =>
              onChange(field.key, e.target.value || undefined, true)
            }
            options={[
              { value: "", label: "Tous" },
              { value: "1", label: field.trueLabel ?? "Oui" },
              { value: "0", label: field.falseLabel ?? "Non" },
            ]}
          />
        </div>
      );
    }
  }
}
