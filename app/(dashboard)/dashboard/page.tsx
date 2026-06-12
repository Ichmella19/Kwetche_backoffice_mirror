"use client";

import { useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CheckCircle,
  Clock,
  Inbox,
  Landmark,
  LifeBuoy,
  PiggyBank,
  Receipt,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { StatCard } from "@/presentation/components/shared/stat-card";
import { ErrorState } from "@/presentation/components/shared/error";
import { Sparkline } from "@/presentation/components/shared/sparkline";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { useAuth } from "@/presentation/contexts/auth-context";
import { useAsync, useRealtime } from "@/presentation/hooks";
import { dashboardService } from "@/presentation/services/dashboard";
import { ROUTES } from "@/lib/constants";
import {
  RECOUVREMENT_CASE_STATUS_LABELS,
  TONTINE_STATUS_LABELS,
} from "@/lib/enums";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { DashboardStats, DashboardTimeseries } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    execute: reloadStats,
  } = useAsync<DashboardStats>(
    useCallback(() => dashboardService.getStats(), []),
  );

  const {
    data: series,
    isLoading: seriesLoading,
    execute: reloadSeries,
  } = useAsync<DashboardTimeseries>(
    useCallback(() => dashboardService.getTimeseries({ days: 30 }), []),
  );

  // Refresh live sur les events qui font bouger les KPIs.
  useRealtime(
    [
      "kyc.identity.submitted",
      "kyc.document.submitted",
      "recouvrement.case.assigned",
      "wallet.transaction.updated",
    ],
    () => {
      void reloadStats();
      void reloadSeries();
    },
  );

  if (statsError) {
    return (
      <ErrorState
        message={getErrorMessage(statsError)}
        onRetry={reloadStats}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Bonjour ${user?.first_name ?? ""} 👋`}
        description="Vue d'ensemble en temps réel de l'activité Kwetche."
      />

      {/* ── À traiter ────────────────────────────────────────────── */}
      <ToDoBlock stats={stats} isLoading={statsLoading} />

      {/* KPIs principaux */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Utilisateurs"
          value={stats ? formatNumber(stats.users.total) : "—"}
          icon={Users}
          tone="secondary"
          isLoading={statsLoading}
          hint={
            stats
              ? `${stats.users.verified} vérifiés · ${stats.users.staff} staff`
              : undefined
          }
        />
        <StatCard
          label="KYC en attente"
          value={stats?.kyc.pending_identity}
          icon={ShieldCheck}
          tone="warning"
          isLoading={statsLoading}
          hint={
            stats
              ? `${stats.kyc.approved_identity} approuvés · ${stats.kyc.declined_identity} refusés`
              : "Identités à examiner"
          }
        />
        <StatCard
          label="Solde plateforme"
          value={stats ? formatCurrency(stats.wallet.total_balance) : "—"}
          icon={Wallet}
          tone="primary"
          isLoading={statsLoading}
          hint={
            stats
              ? `${formatCurrency(stats.wallet.total_locked)} bloqués · ${stats.wallet.pending_tx} tx à valider`
              : undefined
          }
        />
        <StatCard
          label="Tontines actives"
          value={stats?.tontines.by_status.active ?? 0}
          icon={PiggyBank}
          tone="accent"
          isLoading={statsLoading}
          hint={
            stats
              ? `${stats.tontines.total} au total · ${stats.tontines.by_status.pending_start} à démarrer`
              : undefined
          }
        />
      </div>

      {/* Bloc recouvrement (rouge si tension) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Dettes ouvertes"
          value={stats?.recouvrement.open_debts}
          icon={Receipt}
          tone="warning"
          isLoading={statsLoading}
          hint={
            stats
              ? `${formatCurrency(stats.recouvrement.open_amount_due)} restant à recouvrer`
              : undefined
          }
        />
        <StatCard
          label="Dossiers à assigner"
          value={
            stats?.recouvrement.cases_by_status.pending_assignment ?? 0
          }
          icon={Scale}
          tone="primary"
          isLoading={statsLoading}
          hint="File commune recouvrement"
        />
        <StatCard
          label="Recouvré (total)"
          value={
            stats
              ? formatCurrency(stats.recouvrement.recovered_total)
              : "—"
          }
          icon={CheckCircle}
          tone="info"
          isLoading={statsLoading}
        />
        <StatCard
          label="Nouveaux comptes (7j)"
          value={stats?.users.new_7d}
          icon={UserPlus}
          tone="accent"
          isLoading={statsLoading}
        />
      </div>

      {/* Courbes 30 jours */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Activité — 30 derniers jours
          </h2>
          {series && (
            <span className="text-xs text-muted">
              Période : {series.days} jours
            </span>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ChartCard
            label="Inscriptions"
            icon={UserPlus}
            color="var(--secondary, #6366f1)"
            values={series?.signups.map((p) => p.value) ?? []}
            isLoading={seriesLoading}
            total={series?.signups.reduce((s, p) => s + p.value, 0) ?? 0}
            unit="comptes"
          />
          <ChartCard
            label="Recharges wallet"
            icon={TrendingUp}
            color="var(--success, #22c55e)"
            values={series?.wallet_credit.map((p) => p.value) ?? []}
            isLoading={seriesLoading}
            total={
              series?.wallet_credit.reduce((s, p) => s + p.value, 0) ?? 0
            }
            isCurrency
          />
          <ChartCard
            label="Retraits & sorties"
            icon={TrendingDown}
            color="var(--danger, #ef4444)"
            values={series?.wallet_debit.map((p) => p.value) ?? []}
            isLoading={seriesLoading}
            total={
              series?.wallet_debit.reduce((s, p) => s + p.value, 0) ?? 0
            }
            isCurrency
          />
          <ChartCard
            label="Dettes créées"
            icon={Receipt}
            color="var(--warning, #f59e0b)"
            values={series?.debts_created.map((p) => p.value) ?? []}
            isLoading={seriesLoading}
            total={
              series?.debts_created.reduce((s, p) => s + p.value, 0) ?? 0
            }
            unit="dettes"
          />
        </div>
      </section>

      {/* Détails utilisateurs + tontines + recouvrement */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Niveaux KYC</h3>
              <Badge variant="neutral">{stats?.users.total ?? 0} users</Badge>
            </div>
            {statsLoading || !stats ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-2">
                {(["0", "1", "2", "3"] as const).map((lvl) => {
                  const count = stats.users.by_kyc_level[lvl] ?? 0;
                  const total = stats.users.total || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={lvl}>
                      <div className="flex items-center justify-between text-sm">
                        <span>Niveau {lvl}</span>
                        <span className="text-muted">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted-soft">
                        <div
                          className="h-full rounded-full bg-secondary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Tontines par statut</h3>
              <Badge variant="neutral">
                {stats?.tontines.total ?? 0} au total
              </Badge>
            </div>
            {statsLoading || !stats ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <ul className="space-y-2 text-sm">
                {Object.entries(stats.tontines.by_status).map(
                  ([status, count]) => (
                    <li
                      key={status}
                      className="flex items-center justify-between"
                    >
                      <span>{TONTINE_STATUS_LABELS[status] ?? status}</span>
                      <Badge
                        variant={status === "active" ? "secondary" : "outline"}
                      >
                        {count}
                      </Badge>
                    </li>
                  ),
                )}
              </ul>
            )}
            <div className="border-t border-border pt-3 text-xs text-muted">
              Fond de réserve cumulé :{" "}
              <span className="font-medium text-foreground">
                {stats
                  ? formatCurrency(stats.tontines.reserve_fund_total)
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Recouvrement</h3>
            </div>
            {statsLoading || !stats ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <ul className="space-y-2 text-sm">
                {Object.entries(stats.recouvrement.cases_by_status).map(
                  ([status, count]) => (
                    <li
                      key={status}
                      className="flex items-center justify-between"
                    >
                      <span>
                        {RECOUVREMENT_CASE_STATUS_LABELS[status] ?? status}
                      </span>
                      <Badge variant="outline">{count}</Badge>
                    </li>
                  ),
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Volume wallet 24h/7j/30j */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Volume wallet validé</h3>
            <Landmark className="size-4 text-muted" />
          </div>
          {statsLoading || !stats ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {(["24h", "7d", "30d"] as const).map((window) => {
                const credit = stats.wallet.volume[window].credit;
                const debit = stats.wallet.volume[window].debit;
                const net = credit - debit;
                return (
                  <div
                    key={window}
                    className="rounded-lg border border-border bg-surface-2 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">
                        {window === "24h"
                          ? "Dernières 24h"
                          : window === "7d"
                            ? "7 derniers jours"
                            : "30 derniers jours"}
                      </span>
                      <Banknote className="size-4 text-muted" />
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-success">Crédits</span>
                        <span className="font-medium">
                          {formatCurrency(credit)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-danger">Débits</span>
                        <span className="font-medium">
                          {formatCurrency(debit)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-1">
                        <span>Net</span>
                        <span
                          className={`font-semibold ${
                            net >= 0 ? "text-success" : "text-danger"
                          }`}
                        >
                          {formatCurrency(net)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ActionCard
          title="File KYC"
          description="Dossiers identité à valider."
          href={ROUTES.KYC}
          icon={ShieldCheck}
        />
        <ActionCard
          title="Recouvrement"
          description="Dossiers à assigner ou en cours."
          href={ROUTES.RECOUVREMENT}
          icon={Scale}
        />
        <ActionCard
          title="Tontines à démarrer"
          description="Quota insuffisant — décision à prendre."
          href={ROUTES.TONTINES}
          icon={Clock}
        />
      </div>
    </div>
  );
}

function ChartCard({
  label,
  icon: Icon,
  color,
  values,
  total,
  unit,
  isCurrency,
  isLoading,
}: {
  label: string;
  icon: typeof UserPlus;
  color: string;
  values: number[];
  total: number;
  unit?: string;
  isCurrency?: boolean;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">{label}</span>
          <Icon className="size-4 text-muted" />
        </div>
        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <>
            <div className="text-xl font-semibold">
              {isCurrency
                ? formatCurrency(total)
                : `${formatNumber(total)}${unit ? ` ${unit}` : ""}`}
            </div>
            <div style={{ color }}>
              <Sparkline values={values} height={42} label={label} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: typeof ShieldCheck;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-6">
        <div className="space-y-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted">{description}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>
            <Icon className="size-4" />
            Ouvrir
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Bloc « À traiter » : 5 cartes cliquables orientées action ──────────

function relAge(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const ms = Date.now() - t;
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} j`;
}

function ToDoBlock({
  stats,
  isLoading,
}: {
  stats: DashboardStats | null | undefined;
  isLoading: boolean;
}) {
  const tiles = [
    {
      label: "KYC Identité",
      sub: "Hard-gate — priorité max",
      icon: ShieldCheck,
      count: stats?.kyc.pending_identity ?? 0,
      age: relAge(stats?.kyc.oldest_pending_identity_at),
      href: ROUTES.KYC,
      tone: "danger" as const,
    },
    {
      label: "Docs KYC N2/N3",
      sub: "Pièces complémentaires",
      icon: ShieldCheck,
      count:
        (stats?.kyc.pending_documents_n2 ?? 0) +
        (stats?.kyc.pending_documents_n3 ?? 0),
      age: relAge(
        // plus ancien des deux
        [
          stats?.kyc.oldest_pending_doc_n2_at,
          stats?.kyc.oldest_pending_doc_n3_at,
        ]
          .filter(Boolean)
          .sort()[0] as string | undefined,
      ),
      href: ROUTES.KYC_N2,
      tone: "warning" as const,
    },
    {
      label: "Transactions",
      sub: "À valider / rejeter",
      icon: Wallet,
      count: stats?.wallet.pending_tx ?? 0,
      age: relAge(stats?.wallet.oldest_pending_tx_at),
      href: ROUTES.WALLET_TRANSACTIONS,
      tone: "warning" as const,
    },
    {
      label: "Tickets support",
      sub: "Ouverts ou en cours",
      icon: LifeBuoy,
      count: stats?.support?.open_tickets ?? 0,
      age: relAge(stats?.support?.oldest_open_ticket_at),
      href: ROUTES.SUPPORT,
      tone: "info" as const,
    },
    {
      label: "Recouvrement",
      sub: "Dettes ouvertes",
      icon: Scale,
      count: stats?.recouvrement.open_debts ?? 0,
      age: relAge(stats?.recouvrement.oldest_open_debt_at),
      href: ROUTES.RECOUVREMENT,
      tone: "info" as const,
    },
  ];
  const totalToDo = tiles.reduce((s, t) => s + t.count, 0);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Inbox className="size-5 text-primary" />
          À traiter
          <Badge variant={totalToDo > 0 ? "danger" : "neutral"}>
            {totalToDo}
          </Badge>
        </h2>
        <Button asChild variant="ghost" size="sm">
          <Link href={ROUTES.INBOX}>
            Voir tout
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.label}
              href={t.href}
              className="group focus-visible:outline-none"
            >
              <Card className="h-full transition-colors group-hover:bg-muted/30 group-focus-visible:bg-muted/30">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between">
                    <Icon className="size-5 text-muted" />
                    {isLoading ? (
                      <Skeleton className="h-5 w-10" />
                    ) : (
                      <Badge
                        variant={t.count > 0 ? t.tone : "neutral"}
                        className="text-base"
                      >
                        {t.count}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t.label}
                    </p>
                    <p className="text-xs text-muted">{t.sub}</p>
                  </div>
                  {t.count > 0 && t.age ? (
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <Clock className="size-3" />
                      Plus ancien : {t.age}
                    </p>
                  ) : (
                    <p className="text-xs text-muted">À jour</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
