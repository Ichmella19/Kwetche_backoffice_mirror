"use client";

import { useCallback } from "react";
import Link from "next/link";
import { AlarmClock, ArrowRight, Users } from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { ErrorState } from "@/presentation/components/shared/error";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/components/ui/table";
import { useAsync, useRealtime } from "@/presentation/hooks";
import { tontineService } from "@/presentation/services/tontine";
import { ROUTES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { TontinePendingStartResponse } from "@/lib/types";

function startAgeBadge(startDate: string | null) {
  if (!startDate) return null;
  const ms = Date.now() - Date.parse(startDate);
  const days = Math.floor(ms / (24 * 3600_000));
  if (days < 0) return null;
  const variant = days >= 3 ? "danger" : days >= 1 ? "warning" : "neutral";
  return { label: days === 0 ? "Aujourd'hui" : `+${days} j`, variant } as const;
}

export default function TontinePendingStartPage() {
  const fetchPending = useCallback(
    () => tontineService.listPendingStart(),
    [],
  );
  const { data, isLoading, error, execute } =
    useAsync<TontinePendingStartResponse>(fetchPending);

  useRealtime(["tontine.updated"], () => {
    void execute();
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tontines à démarrer"
        description="Date de démarrage atteinte mais quota de membres non rempli. À toi de trancher : démarrer avec les inscrits, reporter, ou annuler."
        actions={
          <Badge variant="warning" className="gap-1">
            <AlarmClock className="size-3.5" />
            {data?.total ?? 0} en attente
          </Badge>
        }
      />

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={execute} />
      ) : isLoading && !data ? (
        <Card>
          <CardContent className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Rien à traiter"
          description="Aucune tontine n'attend une décision de démarrage."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tontine</TableHead>
                  <TableHead className="text-right">Cotisation</TableHead>
                  <TableHead>Inscrits / quota</TableHead>
                  <TableHead>Manquants</TableHead>
                  <TableHead>Démarrage prévu</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((t) => {
                  const age = startAgeBadge(t.start_date);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(t.contribution_amount, t.currency)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <Users className="size-3.5 text-muted" />
                          {t.joined_members}/{t.max_members}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={t.missing_members > 0 ? "warning" : "success"}
                        >
                          {t.missing_members}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="inline-flex items-center gap-2">
                          {formatDate(t.start_date)}
                          {age ? (
                            <Badge variant={age.variant}>{age.label}</Badge>
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`${ROUTES.TONTINES}/${t.id}`}>
                            Traiter
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
