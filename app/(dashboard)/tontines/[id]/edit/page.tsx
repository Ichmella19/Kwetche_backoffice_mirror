"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { FieldWithInfo } from "@/presentation/components/ui/field-with-info";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Textarea } from "@/presentation/components/ui/textarea";
import { useToast } from "@/presentation/hooks";
import { tontineService } from "@/presentation/services/tontine";
import { ROUTES } from "@/lib/constants";
import {
  TONTINE_DRAW_MODE_LABELS,
  TONTINE_FREQUENCY_LABELS,
  TONTINE_TYPE_LABELS,
  TontineDrawMode,
  TontineFrequency,
  TontineStatus,
  TontineType,
} from "@/lib/enums";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { Tontine, UpdateTontineInput } from "@/lib/types";

function toDateInput(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function tontineToForm(t: Tontine): UpdateTontineInput {
  return {
    name: t.name,
    type: t.type,
    draw_mode: t.draw_mode,
    contribution_amount: t.contribution_amount,
    frequency: t.frequency,
    max_members: t.max_members,
    total_rounds: t.total_rounds,
    start_date: toDateInput(t.start_date) || null,
    commission_rate: t.commission_rate,
    required_kyc_level: t.required_kyc_level,
    caution_amount: t.caution_amount,
    cancellation_window_days: t.cancellation_window_days,
    cancellation_penalty_rate: t.cancellation_penalty_rate,
    platform_takes_first_round: t.platform_takes_first_round,
    loyalty_bonus_enabled: t.loyalty_bonus_enabled,
    loyalty_bonus_rate: t.loyalty_bonus_rate,
    description: t.description ?? null,
  };
}

export default function EditTontinePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();
  const [form, setForm] = useState<UpdateTontineInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notDraft, setNotDraft] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const detail = await tontineService.detail(id);
        if (cancelled) return;
        if (detail.tontine.status !== TontineStatus.DRAFT) {
          setNotDraft(true);
        } else {
          setForm(tontineToForm(detail.tontine));
        }
      } catch (err) {
        toast.error("Chargement impossible", getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  const set = <K extends keyof UpdateTontineInput>(
    key: K,
    value: UpdateTontineInput[K],
  ) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const submit = async () => {
    if (!form) return;
    if ((form.name ?? "").trim().length < 2) {
      toast.error("Nom requis", "Donnez un nom à la tontine.");
      return;
    }
    if ((form.contribution_amount ?? 0) <= 0 || (form.max_members ?? 0) < 2) {
      toast.error("Valeurs invalides", "Vérifiez la cotisation et le quota.");
      return;
    }
    setBusy(true);
    try {
      await tontineService.update(id, form);
      toast.success("Tontine mise à jour.");
      router.push(`${ROUTES.TONTINES}/${id}`);
    } catch (err) {
      toast.error("Échec mise à jour", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Modifier la tontine" />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Chargement…
          </CardContent>
        </Card>
      </div>
    );
  }

  if (notDraft) {
    return (
      <div className="space-y-6">
        <PageHeader title="Modification impossible" />
        <Card>
          <CardContent className="space-y-3 p-6 text-sm">
            <p>
              Cette tontine n&apos;est plus en brouillon. Seules les tontines
              en statut <code>draft</code> peuvent être modifiées.
            </p>
            <Button onClick={() => router.push(`${ROUTES.TONTINES}/${id}`)}>
              Retour au détail
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modifier la tontine"
        description="Ajustez la configuration. Une fois publiée, l'édition sera verrouillée."
      />

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <FieldWithInfo
            label="Nom"
            htmlFor="t-name"
            required
            info="Nom commercial de la tontine."
          >
            <Input
              id="t-name"
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
            />
          </FieldWithInfo>

          <FieldWithInfo label="Type" htmlFor="t-type" required>
            <Select
              id="t-type"
              value={form.type ?? TontineType.ROTATING}
              options={Object.values(TontineType).map((v) => ({
                value: v,
                label: TONTINE_TYPE_LABELS[v] ?? v,
              }))}
              onChange={(e) => set("type", e.target.value)}
            />
          </FieldWithInfo>

          <FieldWithInfo label="Mode de tirage" htmlFor="t-draw" required>
            <Select
              id="t-draw"
              value={form.draw_mode ?? TontineDrawMode.REVEALED}
              options={Object.values(TontineDrawMode).map((v) => ({
                value: v,
                label: TONTINE_DRAW_MODE_LABELS[v] ?? v,
              }))}
              onChange={(e) => set("draw_mode", e.target.value)}
            />
          </FieldWithInfo>

          <FieldWithInfo label="Fréquence" htmlFor="t-freq" required>
            <Select
              id="t-freq"
              value={form.frequency ?? TontineFrequency.MONTHLY}
              options={Object.values(TontineFrequency).map((v) => ({
                value: v,
                label: TONTINE_FREQUENCY_LABELS[v] ?? v,
              }))}
              onChange={(e) => set("frequency", e.target.value)}
            />
          </FieldWithInfo>

          <FieldWithInfo label="Cotisation (XOF)" htmlFor="t-amount" required>
            <Input
              id="t-amount"
              type="number"
              min={1}
              value={form.contribution_amount ?? 0}
              onChange={(e) =>
                set("contribution_amount", Number(e.target.value) || 0)
              }
            />
          </FieldWithInfo>

          <FieldWithInfo label="Caution (XOF)" htmlFor="t-caution">
            <Input
              id="t-caution"
              type="number"
              min={0}
              value={form.caution_amount ?? 0}
              onChange={(e) =>
                set("caution_amount", Number(e.target.value) || 0)
              }
            />
          </FieldWithInfo>

          <FieldWithInfo label="Membres max" htmlFor="t-max" required>
            <Input
              id="t-max"
              type="number"
              min={2}
              value={form.max_members ?? 0}
              onChange={(e) => set("max_members", Number(e.target.value) || 0)}
            />
          </FieldWithInfo>

          <FieldWithInfo label="Nombre de tours" htmlFor="t-rounds">
            <Input
              id="t-rounds"
              type="number"
              min={0}
              value={form.total_rounds ?? 0}
              onChange={(e) =>
                set("total_rounds", Number(e.target.value) || 0)
              }
            />
          </FieldWithInfo>

          <FieldWithInfo label="Date de démarrage" htmlFor="t-start">
            <Input
              id="t-start"
              type="date"
              value={form.start_date ?? ""}
              onChange={(e) => set("start_date", e.target.value || null)}
            />
          </FieldWithInfo>

          <FieldWithInfo label="Commission (%)" htmlFor="t-commission">
            <Input
              id="t-commission"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.commission_rate ?? 0}
              onChange={(e) =>
                set("commission_rate", Number(e.target.value) || 0)
              }
            />
          </FieldWithInfo>

          <FieldWithInfo label="KYC requis (niveau)" htmlFor="t-kyc">
            <Input
              id="t-kyc"
              type="number"
              min={0}
              max={3}
              value={form.required_kyc_level ?? 1}
              onChange={(e) =>
                set("required_kyc_level", Number(e.target.value) || 0)
              }
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Fenêtre de désistement (jours)"
            htmlFor="t-cwin"
          >
            <Input
              id="t-cwin"
              type="number"
              min={0}
              value={form.cancellation_window_days ?? 0}
              onChange={(e) =>
                set("cancellation_window_days", Number(e.target.value) || 0)
              }
            />
          </FieldWithInfo>

          <FieldWithInfo label="Pénalité désistement (%)" htmlFor="t-cpen">
            <Input
              id="t-cpen"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.cancellation_penalty_rate ?? 0}
              onChange={(e) =>
                set("cancellation_penalty_rate", Number(e.target.value) || 0)
              }
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Plateforme prend le 1er tour"
            htmlFor="t-firstround"
          >
            <Select
              id="t-firstround"
              value={form.platform_takes_first_round ? "true" : "false"}
              options={[
                { value: "true", label: "Oui" },
                { value: "false", label: "Non" },
              ]}
              onChange={(e) =>
                set("platform_takes_first_round", e.target.value === "true")
              }
            />
          </FieldWithInfo>

          <FieldWithInfo label="Bonus de fidélité activé" htmlFor="t-bonus">
            <Select
              id="t-bonus"
              value={form.loyalty_bonus_enabled ? "true" : "false"}
              options={[
                { value: "false", label: "Non" },
                { value: "true", label: "Oui" },
              ]}
              onChange={(e) =>
                set("loyalty_bonus_enabled", e.target.value === "true")
              }
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Taux bonus (% du fond de réserve)"
            htmlFor="t-bonus-rate"
          >
            <Input
              id="t-bonus-rate"
              type="number"
              min={0}
              max={100}
              step={0.1}
              disabled={!form.loyalty_bonus_enabled}
              value={form.loyalty_bonus_rate ?? 0}
              onChange={(e) =>
                set("loyalty_bonus_rate", Number(e.target.value) || 0)
              }
            />
          </FieldWithInfo>

          <div className="sm:col-span-2">
            <FieldWithInfo label="Description" htmlFor="t-desc">
              <Textarea
                id="t-desc"
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value || null)}
                maxLength={1000}
              />
            </FieldWithInfo>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => router.push(`${ROUTES.TONTINES}/${id}`)}
        >
          Annuler
        </Button>
        <Button isLoading={busy} onClick={submit}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
