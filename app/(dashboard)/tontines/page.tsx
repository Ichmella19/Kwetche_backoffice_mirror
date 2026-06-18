"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Plus } from "lucide-react";
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
import { useAsync, useRealtime } from "@/presentation/hooks";
import { tontineService } from "@/presentation/services/tontine";
import { ROUTES } from "@/lib/constants";
import {
  TONTINE_DRAW_MODE_LABELS,
  TONTINE_FREQUENCY_LABELS,
  TONTINE_STATUS_LABELS,
  TONTINE_TYPE_LABELS,
  TontineDrawMode,
  TontineFrequency,
  TontineStatus,
  TontineType,
} from "@/lib/enums";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { TontineListResponse } from "@/lib/types";
import type { BadgeProps } from "@/presentation/components/ui/badge";

const PER_PAGE = 20;

const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  [TontineStatus.DRAFT]: "neutral",
  [TontineStatus.OPEN]: "info",
  [TontineStatus.PENDING_START]: "warning",
  [TontineStatus.ACTIVE]: "success",
  [TontineStatus.COMPLETED]: "secondary",
  [TontineStatus.CANCELLED]: "danger",
};

const TONTINE_FILTERS: FilterField[] = [
  {
    kind: "text",
    key: "search",
    label: "Recherche",
    placeholder: "Nom de la tontine…",
  },
  {
    kind: "multi",
    key: "statuses",
    label: "Statuts",
    options: Object.values(TontineStatus).map((v) => ({
      value: v,
      label: TONTINE_STATUS_LABELS[v] ?? v,
    })),
  },
  {
    kind: "multi",
    key: "types",
    label: "Types",
    options: Object.values(TontineType).map((v) => ({
      value: v,
      label: TONTINE_TYPE_LABELS[v] ?? v,
    })),
  },
  {
    kind: "multi",
    key: "frequencies",
    label: "Fréquence",
    options: Object.values(TontineFrequency).map((v) => ({
      value: v,
      label: TONTINE_FREQUENCY_LABELS[v] ?? v,
    })),
  },
  {
    kind: "multi",
    key: "draw_modes",
    label: "Mode de tirage",
    options: Object.values(TontineDrawMode).map((v) => ({
      value: v,
      label: TONTINE_DRAW_MODE_LABELS[v] ?? v,
    })),
  },
  {
    kind: "date-range",
    key: "start",
    label: "Date de démarrage",
  },
  {
    kind: "select",
    key: "sort",
    label: "Tri",
    placeholder: "Plus récent d'abord",
    options: [
      { value: "created_desc", label: "Plus récent d'abord" },
      { value: "created_asc", label: "Plus ancien d'abord" },
      { value: "start_asc", label: "Démarrage le plus proche" },
      { value: "start_desc", label: "Démarrage le plus lointain" },
      { value: "name_asc", label: "Nom (A→Z)" },
      { value: "amount_desc", label: "Montant (plus élevé d'abord)" },
    ],
  },
];

function FillBar({ count, max }: { count: number; max: number }) {
  const percent = max ? Math.min(100, Math.round((count / max) * 100)) : 0;
  const full = percent >= 100;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted-soft">
        <div
          className={`h-full rounded-full ${full ? "bg-accent" : "bg-primary"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted">
        {count}/{max}
      </span>
    </div>
  );
}

export default function TontinesPage() {
  const [page, setPage] = useState(1);
  const [values, setValues] = useState<FilterValues>({});

  const fetchTontines = useCallback(() => {
    const v = values;
    const asStr = (k: string) =>
      typeof v[k] === "string" ? (v[k] as string) : undefined;
    const asArr = (k: string) =>
      Array.isArray(v[k]) ? (v[k] as string[]) : undefined;
    return tontineService.list({
      page,
      perPage: PER_PAGE,
      search: asStr("search"),
      statuses: asArr("statuses"),
      types: asArr("types"),
      frequencies: asArr("frequencies"),
      drawModes: asArr("draw_modes"),
      startFrom: asStr("start_from"),
      startTo: asStr("start_to"),
      sort: asStr("sort") ?? "created_desc",
    });
  }, [page, values]);

  const { data, isLoading, error, execute } =
    useAsync<TontineListResponse>(fetchTontines);

  useRealtime(["tontine.updated"], () => {
    void execute();
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / PER_PAGE)),
    [data?.total],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tontines"
        description="Configuration, suivi et pilotage des tontines."
        actions={
          <Button asChild>
            <Link href={ROUTES.TONTINE_NEW}>
              <Plus className="mr-2 size-4" /> Nouvelle tontine
            </Link>
          </Button>
        }
      />

      <AdvancedFilters
        fields={TONTINE_FILTERS}
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
          title="Aucune tontine"
          description="Aucune tontine ne correspond à ces filtres."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Cotisation</TableHead>
                  <TableHead>Fréquence</TableHead>
                  <TableHead>Membres</TableHead>
                  <TableHead>Démarrage</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      {TONTINE_TYPE_LABELS[t.type] ?? t.type}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(t.contribution_amount, t.currency)}
                    </TableCell>
                    <TableCell>
                      {TONTINE_FREQUENCY_LABELS[t.frequency] ?? t.frequency}
                    </TableCell>
                    <TableCell>
                      <FillBar
                        count={t.member_count ?? 0}
                        max={t.max_members}
                      />
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(t.start_date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[t.status] ?? "neutral"}>
                        {TONTINE_STATUS_LABELS[t.status] ?? t.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`${ROUTES.TONTINES}/${t.id}`}>
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
