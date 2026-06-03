"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Plus, Search } from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { ErrorState } from "@/presentation/components/shared/error";
import { Pagination } from "@/presentation/components/shared/pagination";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
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
import { useAsync, useDebounce, useRealtime } from "@/presentation/hooks";
import { tontineService } from "@/presentation/services/tontine";
import { ROUTES } from "@/lib/constants";
import {
  TONTINE_FREQUENCY_LABELS,
  TONTINE_STATUS_LABELS,
  TONTINE_TYPE_LABELS,
  TontineStatus,
} from "@/lib/enums";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { TontineListResponse } from "@/lib/types";
import type { BadgeProps } from "@/presentation/components/ui/badge";

const PER_PAGE = 20;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  ...Object.values(TontineStatus).map((value) => ({
    value,
    label: TONTINE_STATUS_LABELS[value] ?? value,
  })),
];

const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  [TontineStatus.DRAFT]: "neutral",
  [TontineStatus.OPEN]: "info",
  [TontineStatus.PENDING_START]: "warning",
  [TontineStatus.ACTIVE]: "success",
  [TontineStatus.COMPLETED]: "secondary",
  [TontineStatus.CANCELLED]: "danger",
};

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
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  const fetchTontines = useCallback(
    () =>
      tontineService.list({
        page,
        perPage: PER_PAGE,
        status: status || undefined,
        search: debouncedSearch.trim() || undefined,
      }),
    [page, status, debouncedSearch],
  );
  const { data, isLoading, error, execute } =
    useAsync<TontineListResponse>(fetchTontines);

  // Refresh live à chaque changement de statut / inscription / désistement.
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

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Input
              placeholder="Rechercher une tontine par nom…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leadingIcon={<Search />}
            />
          </div>
          <Select
            value={status}
            options={STATUS_FILTER_OPTIONS}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          />
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
          title="Aucune tontine"
          description="Créez votre première tontine."
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
