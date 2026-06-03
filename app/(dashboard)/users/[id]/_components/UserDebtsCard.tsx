"use client";

import { useCallback, useMemo } from "react";
import { Badge } from "@/presentation/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/components/ui/table";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { ErrorState } from "@/presentation/components/shared/error";
import { useAsync } from "@/presentation/hooks";
import { userService } from "@/presentation/services/user";
import { DEBT_STATUS_LABELS, DEBT_TYPE_LABELS } from "@/lib/enums";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type {
  UserDebtEntry,
  UserDebtsResponse,
} from "@/core/data/repositories/user/user.repository.impl";

export function UserDebtsCard({ userId }: { userId: string }) {
  const { data, isLoading, error, execute } = useAsync<UserDebtsResponse>(
    useCallback(() => userService.listUserDebts(userId), [userId]),
  );

  const open = useMemo(
    () =>
      data?.items.filter((d) =>
        ["open", "in_recovery", "partially_recovered"].includes(d.status),
      ) ?? [],
    [data],
  );
  const settled = useMemo(
    () => data?.items.filter((d) => !open.includes(d)) ?? [],
    [data, open],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dettes</CardTitle>
        <CardDescription>
          {data
            ? `${open.length} ouverte(s) · ${settled.length} clôturée(s)`
            : "Créances dues par l'utilisateur."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {error ? (
          <div className="p-6">
            <ErrorState message={getErrorMessage(error)} onRetry={execute} />
          </div>
        ) : isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Aucune dette"
              description="L'utilisateur n'a aucune dette enregistrée."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Dû</TableHead>
                <TableHead className="text-right">Recouvré</TableHead>
                <TableHead className="text-right">Restant</TableHead>
                <TableHead>Relances</TableHead>
                <TableHead>Créée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((d: UserDebtEntry) => (
                <TableRow key={d.id}>
                  <TableCell>{DEBT_TYPE_LABELS[d.type] ?? d.type}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        d.status === "recovered"
                          ? "secondary"
                          : d.status === "written_off" ||
                              d.status === "in_recovery"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {DEBT_STATUS_LABELS[d.status] ?? d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(d.amount_due, d.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(d.amount_recovered, d.currency)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(d.remaining, d.currency)}
                  </TableCell>
                  <TableCell>{d.relance_count}</TableCell>
                  <TableCell className="text-xs">
                    {formatDate(d.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
