"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { ErrorState } from "@/presentation/components/shared/error";
import { Pagination } from "@/presentation/components/shared/pagination";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Select } from "@/presentation/components/ui/select";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/components/ui/table";
import { useAsync, useAuth, useRealtime } from "@/presentation/hooks";
import { recouvrementService } from "@/presentation/services/recouvrement";
import { ROUTES } from "@/lib/constants";
import {
  RECOUVREMENT_CASE_STATUS_LABELS,
  RecouvrementCaseStatus,
} from "@/lib/enums";
import { formatCurrency, formatDateTime } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { RecouvrementCaseListResponse } from "@/lib/types";

const PER_PAGE = 20;
const STATUS_OPTIONS = [
  { value: "", label: "Tous" },
  ...Object.values(RecouvrementCaseStatus).map((v) => ({
    value: v,
    label: RECOUVREMENT_CASE_STATUS_LABELS[v] ?? v,
  })),
];

function variantOf(status: string): "secondary" | "danger" | "neutral" {
  if (status === RecouvrementCaseStatus.RECOVERED) return "secondary";
  if (
    status === RecouvrementCaseStatus.UNCOLLECTIBLE ||
    status === RecouvrementCaseStatus.PENDING_ASSIGNMENT
  )
    return "danger";
  return "neutral";
}

export default function RecouvrementListPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [mineOnly, setMineOnly] = useState(false);

  const fetchCases = useCallback(
    () =>
      recouvrementService.listCases({
        page,
        perPage: PER_PAGE,
        status: status || undefined,
        assignedAgentId: mineOnly ? user?.id : undefined,
      }),
    [page, status, mineOnly, user?.id],
  );
  const { data, isLoading, error, execute } =
    useAsync<RecouvrementCaseListResponse>(fetchCases);

  // Refresh live à chaque escalade auto / case nouvellement assigné.
  useRealtime(["recouvrement.case.assigned"], () => {
    void execute();
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / PER_PAGE)),
    [data?.total],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recouvrement"
        description="File des dossiers de recouvrement."
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <span className="text-sm text-muted">Filtres :</span>
          <Select
            value={status}
            options={STATUS_OPTIONS}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => {
                setMineOnly(e.target.checked);
                setPage(1);
              }}
            />
            Mes dossiers seulement
          </label>
        </CardContent>
      </Card>

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={execute} />
      ) : isLoading && !data ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Aucun dossier"
          description="Aucun dossier de recouvrement avec ces critères."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead className="text-right">Cible</TableHead>
                  <TableHead className="text-right">Recouvré</TableHead>
                  <TableHead>Assigné à</TableHead>
                  <TableHead>Ouvert</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">
                      {c.user_id}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(c.amount_target)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(c.amount_recovered)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.assigned_agent_id ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDateTime(c.opened_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={variantOf(c.status)}>
                        {RECOUVREMENT_CASE_STATUS_LABELS[c.status] ?? c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`${ROUTES.RECOUVREMENT}/${c.id}`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data && data.total > PER_PAGE && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
