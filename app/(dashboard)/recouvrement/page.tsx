"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { ErrorState } from "@/presentation/components/shared/error";
import { Pagination } from "@/presentation/components/shared/pagination";
import {
  AdvancedFilters,
  type FilterField,
  type FilterValues,
} from "@/presentation/components/shared/advanced-filters";
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

const RECOUVREMENT_FILTERS: FilterField[] = [
  {
    kind: "multi",
    key: "statuses",
    label: "Statuts",
    options: Object.values(RecouvrementCaseStatus).map((v) => ({
      value: v,
      label: RECOUVREMENT_CASE_STATUS_LABELS[v] ?? v,
    })),
  },
  {
    kind: "boolean",
    key: "unassigned",
    label: "Non assignés uniquement",
    trueLabel: "Oui",
    falseLabel: "Non",
  },
  {
    kind: "boolean",
    key: "mine_only",
    label: "Mes dossiers seulement",
    trueLabel: "Oui",
    falseLabel: "Non",
  },
  {
    kind: "number-range",
    key: "amount",
    label: "Montant cible (XOF)",
    step: 1000,
    unit: "XOF",
  },
  {
    kind: "date-range",
    key: "opened",
    label: "Date d'ouverture",
  },
  {
    kind: "select",
    key: "sort",
    label: "Tri",
    placeholder: "Plus récent",
    options: [
      { value: "opened_desc", label: "Ouvert (récent)" },
      { value: "opened_asc", label: "Ouvert (ancien)" },
      { value: "amount_desc", label: "Montant (élevé d'abord)" },
      { value: "amount_asc", label: "Montant (faible d'abord)" },
    ],
  },
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
  const [values, setValues] = useState<FilterValues>({});

  const fetchCases = useCallback(() => {
    const v = values;
    const asStr = (k: string) =>
      typeof v[k] === "string" ? (v[k] as string) : undefined;
    const asArr = (k: string) =>
      Array.isArray(v[k]) ? (v[k] as string[]) : undefined;
    const asBool = (k: string) =>
      v[k] === "true" ? true : v[k] === "false" ? false : undefined;
    const asNum = (k: string) => {
      const raw = asStr(k);
      if (raw === undefined) return undefined;
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined;
    };
    return recouvrementService.listCases({
      page,
      perPage: PER_PAGE,
      statuses: asArr("statuses"),
      assignedAgentId: asBool("mine_only") ? user?.id : undefined,
      unassigned: asBool("unassigned") || undefined,
      amountMin: asNum("amount_min"),
      amountMax: asNum("amount_max"),
      openedFrom: asStr("opened_from"),
      openedTo: asStr("opened_to"),
      sort: asStr("sort") ?? "opened_desc",
    });
  }, [page, values, user?.id]);

  const { data, isLoading, error, execute } =
    useAsync<RecouvrementCaseListResponse>(fetchCases);

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

      <AdvancedFilters
        fields={RECOUVREMENT_FILTERS}
        onApply={setValues}
        onPageReset={() => setPage(1)}
        collapsible
      />

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
