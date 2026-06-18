"use client";

import { useCallback } from "react";
import Link from "next/link";
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
import { ROUTES } from "@/lib/constants";
import {
  CAUTION_STATUS_LABELS,
  TONTINE_MEMBER_STATUS_LABELS,
  TONTINE_STATUS_LABELS,
  TONTINE_TYPE_LABELS,
  TontineMemberStatus,
} from "@/lib/enums";
import { formatCurrency } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { UserTontineEntry } from "@/core/data/repositories/user/user.repository.impl";

export function UserTontinesCard({ userId }: { userId: string }) {
  const { data, isLoading, error, execute } = useAsync<UserTontineEntry[]>(
    useCallback(() => userService.listUserTontines(userId), [userId]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tontines</CardTitle>
        <CardDescription>
          Liste des tontines auxquelles cet utilisateur participe ou a participé.
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
        ) : !data || data.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Aucune tontine"
              description="L'utilisateur ne participe à aucune tontine."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tontine</TableHead>
                <TableHead>Participation</TableHead>
                <TableHead>Caution</TableHead>
                <TableHead>Tour</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((entry) => (
                <TableRow key={entry.membership.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`${ROUTES.TONTINES}/${entry.tontine.id}`}
                      className="hover:underline"
                    >
                      {entry.tontine.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {TONTINE_TYPE_LABELS[entry.tontine.type] ??
                      entry.tontine.type}
                  </TableCell>
                  <TableCell>
                    <Badge>
                      {TONTINE_STATUS_LABELS[entry.tontine.status] ??
                        entry.tontine.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.membership.status === TontineMemberStatus.DEFAULTED
                          ? "danger"
                          : "neutral"
                      }
                    >
                      {TONTINE_MEMBER_STATUS_LABELS[entry.membership.status] ??
                        entry.membership.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(
                      entry.membership.caution_amount,
                      entry.tontine.currency,
                    )}{" "}
                    <span className="text-xs text-muted">
                      ({CAUTION_STATUS_LABELS[entry.membership.caution_status] ??
                        entry.membership.caution_status})
                    </span>
                  </TableCell>
                  <TableCell>{entry.membership.payout_order ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
