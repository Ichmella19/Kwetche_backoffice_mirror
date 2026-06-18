"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Inbox as InboxIcon,
  ShieldCheck,
  Wallet as WalletIcon,
  LifeBuoy,
  Scale,
} from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { ErrorState } from "@/presentation/components/shared/error";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { Badge } from "@/presentation/components/ui/badge";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Select } from "@/presentation/components/ui/select";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { useAsync } from "@/presentation/hooks";
import { dashboardService } from "@/presentation/services/dashboard";
import {
  INBOX_KIND_LABELS,
  InboxItemKind,
  routeForInboxItem,
} from "@/lib/enums";
import { formatCurrency } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { InboxItem, InboxResponse } from "@/lib/types";

const KIND_OPTIONS = [
  { value: "", label: "Tous les domaines" },
  ...Object.values(InboxItemKind).map((v) => ({
    value: v,
    label: INBOX_KIND_LABELS[v] ?? v,
  })),
];

const SORT_OPTIONS = [
  { value: "oldest", label: "Plus ancien d'abord" },
  { value: "priority", label: "Priorité décroissante" },
  { value: "newest", label: "Plus récent d'abord" },
];

function iconFor(kind: string) {
  switch (kind) {
    case InboxItemKind.KYC_IDENTITY:
    case InboxItemKind.KYC_N2:
    case InboxItemKind.KYC_N3:
      return ShieldCheck;
    case InboxItemKind.WALLET_TX:
      return WalletIcon;
    case InboxItemKind.SUPPORT:
      return LifeBuoy;
    case InboxItemKind.RECOUVREMENT:
      return Scale;
    default:
      return InboxIcon;
  }
}

function priorityVariant(p: number): "danger" | "warning" | "neutral" {
  if (p >= 90) return "danger";
  if (p >= 60) return "warning";
  return "neutral";
}

/** « il y a X jours / heures / minutes » à partir d'un ISO string. */
function relativeAge(iso: string | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  const ms = Date.now() - t;
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `il y a ${d} j`;
  return new Date(t).toLocaleDateString();
}

export default function InboxPage() {
  const [kind, setKind] = useState("");
  const [sort, setSort] = useState<"oldest" | "priority" | "newest">("oldest");

  const fetchInbox = useCallback(() => dashboardService.getInbox(50), []);
  const { data, isLoading, error, execute } =
    useAsync<InboxResponse>(fetchInbox);

  const filteredItems = useMemo<InboxItem[]>(() => {
    if (!data) return [];
    let items = [...data.items];
    if (kind) items = items.filter((i) => i.kind === kind);
    items.sort((a, b) => {
      if (sort === "oldest") {
        return (a.since ?? "") < (b.since ?? "") ? -1 : 1;
      }
      if (sort === "newest") {
        return (a.since ?? "") > (b.since ?? "") ? -1 : 1;
      }
      // priority desc, then oldest first
      if (a.priority !== b.priority) return b.priority - a.priority;
      return (a.since ?? "") < (b.since ?? "") ? -1 : 1;
    });
    return items;
  }, [data, kind, sort]);

  const summary = useMemo(() => {
    if (!data) return null;
    const acc: Record<string, number> = {};
    for (const it of data.items) acc[it.kind] = (acc[it.kind] ?? 0) + 1;
    return acc;
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="À traiter"
        description="File d'attente unifiée : tout ce qui bloque un client. Triée par ancienneté."
      />

      {/* ── Résumé par domaine ──────────────────────────────────── */}
      {summary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.values(InboxItemKind).map((k) => {
            const Icon = iconFor(k);
            const count = summary[k] ?? 0;
            return (
              <Card key={k}>
                <CardContent className="flex items-start gap-3 p-3">
                  <Icon className="mt-0.5 size-5 text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-muted">
                      {INBOX_KIND_LABELS[k] ?? k}
                    </p>
                    <p className="text-xl font-semibold text-foreground">
                      {count}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      {/* ── Filtres + tri ────────────────────────────────────────── */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <Select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            options={KIND_OPTIONS}
            aria-label="Filtrer par domaine"
          />
          <Select
            value={sort}
            onChange={(e) =>
              setSort(e.target.value as "oldest" | "priority" | "newest")
            }
            options={SORT_OPTIONS}
            aria-label="Trier"
          />
          <div className="flex items-center justify-end text-sm text-muted">
            {data ? `${filteredItems.length} / ${data.total} élément(s)` : ""}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <ErrorState
          title="Impossible de charger la file"
          message={getErrorMessage(error)}
          onRetry={execute}
        />
      ) : isLoading ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="Boîte vide"
          description="Rien à traiter. Tout est à jour."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {filteredItems.map((item, idx) => {
                const Icon = iconFor(item.kind);
                return (
                  <li key={`${item.kind}-${item.ref_id ?? item.user_id}-${idx}`}>
                    <Link
                      href={routeForInboxItem(item)}
                      className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none"
                    >
                      <div className="mt-0.5 rounded-md bg-muted/50 p-2">
                        <Icon className="size-4 text-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={priorityVariant(item.priority)}>
                            {INBOX_KIND_LABELS[item.kind] ?? item.kind}
                          </Badge>
                          {item.priority >= 90 ? (
                            <AlertTriangle className="size-4 text-danger" />
                          ) : null}
                        </div>
                        <p className="mt-1 truncate font-medium text-foreground">
                          {item.subject}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {item.user_label}
                          {item.amount && item.amount > 0
                            ? ` • ${formatCurrency(item.amount)}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 whitespace-nowrap text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {relativeAge(item.since)}
                        </span>
                        <ChevronRight className="size-4" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
