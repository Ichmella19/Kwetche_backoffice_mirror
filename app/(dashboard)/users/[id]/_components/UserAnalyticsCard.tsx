"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Field } from "@/presentation/components/ui/field";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { ErrorState } from "@/presentation/components/shared/error";
import { Sparkline } from "@/presentation/components/shared/sparkline";
import { StatCard } from "@/presentation/components/shared/stat-card";
import { useAsync } from "@/presentation/hooks";
import { userService } from "@/presentation/services/user";
import {
  ANALYTICS_PERIOD_DAYS,
  ANALYTICS_PERIOD_LABELS,
  AnalyticsPeriod,
} from "@/lib/enums";
import { formatCurrency, formatDateTime } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { UserAnalytics } from "@/lib/types";
import { Stat } from "./Stat";

export function UserAnalyticsCard({ userId }: { userId: string }) {
  const [period, setPeriod] = useState<AnalyticsPeriod>(AnalyticsPeriod.MONTH);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const params = useMemo(() => {
    if (period === AnalyticsPeriod.CUSTOM) {
      return {
        days: 30,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
    }
    return { days: ANALYTICS_PERIOD_DAYS[period] };
  }, [endDate, period, startDate]);

  const { data, isLoading, error, execute } = useAsync<UserAnalytics>(
    useCallback(
      () => userService.userAnalytics(userId, params),
      [params, userId],
    ),
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[220px_1fr_auto] lg:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">Période</label>
            <Select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as AnalyticsPeriod)
              }
              options={Object.values(AnalyticsPeriod).map((value) => ({
                value,
                label: ANALYTICS_PERIOD_LABELS[value],
              }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date début">
              <Input
                type="date"
                value={startDate}
                disabled={period !== AnalyticsPeriod.CUSTOM}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </Field>
            <Field label="Date fin">
              <Input
                type="date"
                value={endDate}
                disabled={period !== AnalyticsPeriod.CUSTOM}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </Field>
          </div>
          <Button variant="outline" onClick={() => execute()}>
            Rafraîchir
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={execute} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Net wallet"
              value={data ? formatCurrency(data.wallet.net) : "—"}
              isLoading={isLoading}
            />
            <StatCard
              label="Transactions"
              value={data?.wallet.transaction_count}
              isLoading={isLoading}
            />
            <StatCard
              label="Tontines actives"
              value={data?.tontines.active_memberships}
              isLoading={isLoading}
            />
            <StatCard
              label="Risque restant"
              value={data ? formatCurrency(data.debts.amount_due) : "—"}
              isLoading={isLoading}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <UserSeriesCard
              title="Flux wallet"
              data={data}
              isLoading={isLoading}
            />
            <Card>
              <CardHeader>
                <CardTitle>Résumé opérationnel</CardTitle>
                <CardDescription>
                  Sessions, notifications, dettes et activité tontine.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <Stat
                  label="Connexions"
                  value={String(data?.summary.login_count ?? "—")}
                />
                <Stat
                  label="Sessions actives"
                  value={String(data?.summary.active_sessions ?? "—")}
                />
                <Stat
                  label="Notifications envoyées"
                  value={String(data?.notifications.sent ?? "—")}
                />
                <Stat
                  label="Notifications non lues"
                  value={String(data?.notifications.unread ?? "—")}
                />
                <Stat
                  label="Dettes ouvertes"
                  value={String(data?.debts.open ?? "—")}
                />
                <Stat
                  label="Caution active"
                  value={
                    data ? formatCurrency(data.tontines.caution_total) : "—"
                  }
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historique & modifications</CardTitle>
              <CardDescription>
                Timeline consolidée : profil, KYC, wallet, notifications et
                connexions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : !data?.activity.length ? (
                <p className="text-sm text-muted">
                  Aucun événement sur la période sélectionnée.
                </p>
              ) : (
                data.activity.map((event) => (
                  <div
                    key={event.id}
                    className="flex gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="mt-1 size-2 rounded-full bg-secondary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{event.title}</p>
                        <span className="text-xs text-muted">
                          {formatDateTime(event.created_at)}
                        </span>
                      </div>
                      {event.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted">
                          {event.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">{event.type}</Badge>
                        {event.status && (
                          <Badge variant="neutral">{event.status}</Badge>
                        )}
                        {event.amount !== undefined && (
                          <Badge>{formatCurrency(event.amount)}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function UserSeriesCard({
  title,
  data,
  isLoading,
}: {
  title: string;
  data: UserAnalytics | null;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Crédits et débits validés sur la période.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat
                label="Crédits"
                value={formatCurrency(data?.wallet.credit ?? 0)}
              />
              <Stat
                label="Débits"
                value={formatCurrency(data?.wallet.debit ?? 0)}
              />
              <Stat
                label="Net"
                value={formatCurrency(data?.wallet.net ?? 0)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs text-muted">Crédits</p>
                <Sparkline
                  values={
                    data?.timeseries.wallet_credit.map((p) => p.value) ?? []
                  }
                  height={54}
                  label="Crédits wallet"
                />
              </div>
              <div>
                <p className="mb-2 text-xs text-muted">Débits</p>
                <Sparkline
                  values={
                    data?.timeseries.wallet_debit.map((p) => p.value) ?? []
                  }
                  height={54}
                  label="Débits wallet"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
