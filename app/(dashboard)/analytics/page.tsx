"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Activity,
  Banknote,
  CircleDollarSign,
  Landmark,
  LineChart,
  Receipt,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { ErrorState } from "@/presentation/components/shared/error";
import { Sparkline } from "@/presentation/components/shared/sparkline";
import { StatCard } from "@/presentation/components/shared/stat-card";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/presentation/components/ui/tabs";
import { dashboardService } from "@/presentation/services/dashboard";
import { useAsync, useRealtime } from "@/presentation/hooks";
import {
  ANALYTICS_PERIOD_DAYS,
  ANALYTICS_PERIOD_LABELS,
  AnalyticsPeriod,
  RECOUVREMENT_CASE_STATUS_LABELS,
  TONTINE_STATUS_LABELS,
} from "@/lib/enums";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
} from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { DashboardStats, DashboardTimeseries } from "@/lib/types";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(AnalyticsPeriod.MONTH);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const rangeParams = useMemo(() => {
    if (period === AnalyticsPeriod.CUSTOM) {
      return {
        days: 30,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
    }
    return { days: ANALYTICS_PERIOD_DAYS[period] };
  }, [endDate, period, startDate]);

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
    useCallback(
      () => dashboardService.getTimeseries(rangeParams),
      [rangeParams],
    ),
  );

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

  const walletNet30d = stats
    ? stats.wallet.volume["30d"].credit - stats.wallet.volume["30d"].debit
    : 0;
  const kycTotal = stats
    ? stats.kyc.pending_identity +
      stats.kyc.approved_identity +
      stats.kyc.declined_identity
    : 0;
  const kycApprovalRate =
    stats && kycTotal > 0
      ? Math.round((stats.kyc.approved_identity / kycTotal) * 100)
      : 0;
  const walletLockedRate =
    stats && stats.wallet.total_balance > 0
      ? Math.round((stats.wallet.total_locked / stats.wallet.total_balance) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Pilotage consolidé de la croissance, du risque, du wallet et des tontines."
      />

      <AnalyticsFilters
        period={period}
        startDate={startDate}
        endDate={endDate}
        onPeriodChange={setPeriod}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onRefresh={() => {
          void reloadStats();
          void reloadSeries();
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Base utilisateurs"
          value={stats ? formatNumber(stats.users.total) : "—"}
          icon={Users}
          tone="secondary"
          isLoading={statsLoading}
          hint={stats ? `${stats.users.new_7d} nouveaux sur 7 jours` : undefined}
        />
        <StatCard
          label="Taux validation KYC"
          value={`${kycApprovalRate}%`}
          icon={ShieldCheck}
          tone="accent"
          isLoading={statsLoading}
          hint={stats ? `${stats.kyc.pending_identity} dossiers en attente` : undefined}
        />
        <StatCard
          label="Net wallet 30j"
          value={stats ? formatCurrency(walletNet30d) : "—"}
          icon={CircleDollarSign}
          tone={walletNet30d >= 0 ? "info" : "warning"}
          isLoading={statsLoading}
          hint={stats ? `${walletLockedRate}% du solde est bloqué` : undefined}
        />
        <StatCard
          label="Risque ouvert"
          value={stats ? formatCurrency(stats.recouvrement.open_amount_due) : "—"}
          icon={Scale}
          tone="warning"
          isLoading={statsLoading}
          hint={stats ? `${stats.recouvrement.open_debts} dettes ouvertes` : undefined}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">
            <Activity className="size-4" /> Vue globale
          </TabsTrigger>
          <TabsTrigger value="growth">
            <LineChart className="size-4" /> Croissance & KYC
          </TabsTrigger>
          <TabsTrigger value="finance">
            <Landmark className="size-4" /> Wallet
          </TabsTrigger>
          <TabsTrigger value="risk">
            <Scale className="size-4" /> Tontines & risque
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <SeriesCard
              title={`Inscriptions · ${series?.days ?? rangeParams.days ?? 30}j`}
              icon={UserPlus}
              color="var(--secondary, #6366f1)"
              values={series?.signups.map((p) => p.value) ?? []}
              total={series?.signups.reduce((s, p) => s + p.value, 0) ?? 0}
              unit="comptes"
              isLoading={seriesLoading}
            />
            <SeriesCard
              title={`Dettes créées · ${series?.days ?? rangeParams.days ?? 30}j`}
              icon={Receipt}
              color="var(--warning, #f59e0b)"
              values={series?.debts_created.map((p) => p.value) ?? []}
              total={series?.debts_created.reduce((s, p) => s + p.value, 0) ?? 0}
              unit="dettes"
              isLoading={seriesLoading}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <DistributionCard
              title="Niveaux KYC"
              total={stats?.users.total ?? 0}
              rows={(["0", "1", "2", "3"] as const).map((level) => ({
                label: `Niveau ${level}`,
                value: stats?.users.by_kyc_level[level] ?? 0,
              }))}
              isLoading={statsLoading}
            />
            <StatusListCard
              title="Tontines par statut"
              totalLabel={`${stats?.tontines.total ?? 0} au total`}
              rows={Object.entries(stats?.tontines.by_status ?? {}).map(([status, value]) => ({
                label: TONTINE_STATUS_LABELS[status] ?? status,
                value,
              }))}
              isLoading={statsLoading}
            />
            <StatusListCard
              title="Recouvrement"
              totalLabel={stats ? formatCurrency(stats.recouvrement.recovered_total) : "—"}
              rows={Object.entries(stats?.recouvrement.cases_by_status ?? {}).map(
                ([status, value]) => ({
                  label: RECOUVREMENT_CASE_STATUS_LABELS[status] ?? status,
                  value,
                }),
              )}
              isLoading={statsLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricBlock label="Utilisateurs vérifiés" value={stats?.users.verified} isLoading={statsLoading} />
            <MetricBlock label="Staff" value={stats?.users.staff} isLoading={statsLoading} />
            <MetricBlock label="KYC approuvés" value={stats?.kyc.approved_identity} isLoading={statsLoading} />
            <MetricBlock label="KYC refusés" value={stats?.kyc.declined_identity} isLoading={statsLoading} />
          </div>
          <SeriesCard
            title="Acquisition utilisateurs"
            icon={UserPlus}
            color="var(--secondary, #6366f1)"
            values={series?.signups.map((p) => p.value) ?? []}
            total={series?.signups.reduce((s, p) => s + p.value, 0) ?? 0}
            unit="comptes"
            isLoading={seriesLoading}
          />
          <DistributionCard
            title="Répartition KYC"
            total={stats?.users.total ?? 0}
            rows={(["0", "1", "2", "3"] as const).map((level) => ({
              label: `Niveau ${level}`,
              value: stats?.users.by_kyc_level[level] ?? 0,
            }))}
            isLoading={statsLoading}
          />
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <SeriesCard
              title="Recharges wallet"
              icon={TrendingUp}
              color="var(--success, #22c55e)"
              values={series?.wallet_credit.map((p) => p.value) ?? []}
              total={series?.wallet_credit.reduce((s, p) => s + p.value, 0) ?? 0}
              isCurrency
              isLoading={seriesLoading}
            />
            <SeriesCard
              title="Retraits & débits"
              icon={TrendingDown}
              color="var(--danger, #ef4444)"
              values={series?.wallet_debit.map((p) => p.value) ?? []}
              total={series?.wallet_debit.reduce((s, p) => s + p.value, 0) ?? 0}
              isCurrency
              isLoading={seriesLoading}
            />
          </div>
          <WalletVolumeCard stats={stats} isLoading={statsLoading} />
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricBlock label="Tontines totales" value={stats?.tontines.total} isLoading={statsLoading} />
            <MetricBlock
              label="Fond de réserve"
              value={stats ? formatCurrency(stats.tontines.reserve_fund_total) : undefined}
              isLoading={statsLoading}
            />
            <MetricBlock label="Dettes ouvertes" value={stats?.recouvrement.open_debts} isLoading={statsLoading} />
            <MetricBlock
              label="Recouvré total"
              value={stats ? formatCurrency(stats.recouvrement.recovered_total) : undefined}
              isLoading={statsLoading}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <StatusListCard
              title="Statuts tontines"
              totalLabel={`${stats?.tontines.total ?? 0} au total`}
              rows={Object.entries(stats?.tontines.by_status ?? {}).map(([status, value]) => ({
                label: TONTINE_STATUS_LABELS[status] ?? status,
                value,
              }))}
              isLoading={statsLoading}
            />
            <StatusListCard
              title="Statuts recouvrement"
              totalLabel={stats ? formatCurrency(stats.recouvrement.open_amount_due) : "—"}
              rows={Object.entries(stats?.recouvrement.cases_by_status ?? {}).map(
                ([status, value]) => ({
                  label: RECOUVREMENT_CASE_STATUS_LABELS[status] ?? status,
                  value,
                }),
              )}
              isLoading={statsLoading}
            />
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted">
        Dernière génération : {formatDateTime(stats?.generated_at)}
      </p>
    </div>
  );
}

function SeriesCard({
  title,
  icon: Icon,
  color,
  values,
  total,
  unit,
  isCurrency,
  isLoading,
}: {
  title: string;
  icon: LucideIcon;
  color: string;
  values: number[];
  total: number;
  unit?: string;
  isCurrency?: boolean;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          {title}
          <Icon className="size-4 text-muted" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <>
            <div className="text-2xl font-semibold">
              {isCurrency ? formatCurrency(total) : `${formatNumber(total)}${unit ? ` ${unit}` : ""}`}
            </div>
            <div style={{ color }}>
              <Sparkline values={values} height={64} label={title} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticsFilters({
  period,
  startDate,
  endDate,
  onPeriodChange,
  onStartDateChange,
  onEndDateChange,
  onRefresh,
}: {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  onPeriodChange: (value: AnalyticsPeriod) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onRefresh: () => void;
}) {
  return (
    <Card>
      <CardContent className="grid gap-4 p-4 lg:grid-cols-[220px_1fr_auto] lg:items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Période</label>
          <Select
            value={period}
            onChange={(event) =>
              onPeriodChange(event.target.value as AnalyticsPeriod)
            }
            options={Object.values(AnalyticsPeriod).map((value) => ({
              value,
              label: ANALYTICS_PERIOD_LABELS[value],
            }))}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date début</label>
            <Input
              type="date"
              value={startDate}
              disabled={period !== AnalyticsPeriod.CUSTOM}
              onChange={(event) => onStartDateChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date fin</label>
            <Input
              type="date"
              value={endDate}
              disabled={period !== AnalyticsPeriod.CUSTOM}
              onChange={(event) => onEndDateChange(event.target.value)}
            />
          </div>
        </div>
        <Button variant="outline" onClick={onRefresh}>
          Rafraîchir
        </Button>
      </CardContent>
    </Card>
  );
}

function MetricBlock({
  label,
  value,
  isLoading,
}: {
  label: string;
  value?: string | number;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted">{label}</p>
        {isLoading ? (
          <Skeleton className="mt-2 h-7 w-20" />
        ) : (
          <p className="mt-1 text-2xl font-semibold">{value ?? "—"}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DistributionCard({
  title,
  total,
  rows,
  isLoading,
}: {
  title: string;
  total: number;
  rows: Array<{ label: string; value: number }>;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="neutral">{formatNumber(total)}</Badge>
        </div>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{row.label}</span>
                    <span className="text-muted">
                      {formatNumber(row.value)} · {pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted-soft">
                    <div className="h-full rounded-full bg-secondary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusListCard({
  title,
  totalLabel,
  rows,
  isLoading,
}: {
  title: string;
  totalLabel: string;
  rows: Array<{ label: string; value: number }>;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="outline">{totalLabel}</Badge>
        </div>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted">Aucune donnée.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-3">
                <span className="truncate">{row.label}</span>
                <Badge variant="neutral">{formatNumber(row.value)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function WalletVolumeCard({
  stats,
  isLoading,
}: {
  stats?: DashboardStats | null;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Volume wallet validé</h3>
          <Banknote className="size-4 text-muted" />
        </div>
        {isLoading || !stats ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {(["24h", "7d", "30d"] as const).map((window) => {
              const credit = stats.wallet.volume[window].credit;
              const debit = stats.wallet.volume[window].debit;
              const net = credit - debit;
              return (
                <div key={window} className="rounded-lg border border-border bg-surface-2 p-4">
                  <p className="text-xs text-muted">
                    {window === "24h" ? "24 heures" : window === "7d" ? "7 jours" : "30 jours"}
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <Row label="Crédits" value={formatCurrency(credit)} tone="success" />
                    <Row label="Débits" value={formatCurrency(debit)} tone="danger" />
                    <div className="border-t border-border pt-2">
                      <Row label="Net" value={formatCurrency(net)} tone={net >= 0 ? "success" : "danger"} strong />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: string;
  tone?: "success" | "danger";
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : ""}>
        {label}
      </span>
      <span className={strong ? "font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}
