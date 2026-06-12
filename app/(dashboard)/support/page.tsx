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
import { useAsync, useRealtime } from "@/presentation/hooks";
import { supportService } from "@/presentation/services/support";
import { ROUTES } from "@/lib/constants";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_STATUS_LABELS,
  SupportTicketCategory,
  SupportTicketStatus,
} from "@/lib/enums";
import { formatDateTime } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { SupportTicketListResponse } from "@/lib/types";

const PER_PAGE = 20;

const SUPPORT_FILTERS: FilterField[] = [
  {
    kind: "text",
    key: "search",
    label: "Recherche",
    placeholder: "Sujet du ticket…",
  },
  {
    kind: "multi",
    key: "statuses",
    label: "Statuts",
    options: Object.values(SupportTicketStatus).map((v) => ({
      value: v,
      label: SUPPORT_STATUS_LABELS[v] ?? v,
    })),
  },
  {
    kind: "multi",
    key: "categories",
    label: "Catégories",
    options: Object.values(SupportTicketCategory).map((v) => ({
      value: v,
      label: SUPPORT_CATEGORY_LABELS[v] ?? v,
    })),
  },
  {
    kind: "date-range",
    key: "created",
    label: "Date de création",
  },
  {
    kind: "select",
    key: "sort",
    label: "Tri",
    placeholder: "Dernier message (récent)",
    options: [
      { value: "last_message_desc", label: "Dernier message (récent)" },
      { value: "last_message_asc", label: "Dernier message (ancien)" },
      { value: "created_desc", label: "Création (récent)" },
      { value: "created_asc", label: "Création (ancien)" },
    ],
  },
];

function variantOf(status: string): "secondary" | "danger" | "neutral" {
  if (status === SupportTicketStatus.RESOLVED) return "secondary";
  if (status === SupportTicketStatus.OPEN) return "danger";
  return "neutral";
}

export default function SupportListPage() {
  const [page, setPage] = useState(1);
  const [values, setValues] = useState<FilterValues>({});

  const fetchTickets = useCallback(() => {
    const v = values;
    const asStr = (k: string) =>
      typeof v[k] === "string" ? (v[k] as string) : undefined;
    const asArr = (k: string) =>
      Array.isArray(v[k]) ? (v[k] as string[]) : undefined;
    return supportService.list({
      page,
      perPage: PER_PAGE,
      search: asStr("search"),
      statuses: asArr("statuses"),
      categories: asArr("categories"),
      createdFrom: asStr("created_from"),
      createdTo: asStr("created_to"),
      sort: asStr("sort"),
    });
  }, [page, values]);

  const { data, isLoading, error, execute } =
    useAsync<SupportTicketListResponse>(fetchTickets);

  useRealtime(
    ["support.ticket.created", "support.ticket.updated"],
    () => {
      void execute();
    },
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / PER_PAGE)),
    [data?.total],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Demandes envoyées par les utilisateurs depuis l'application."
      />

      <AdvancedFilters
        fields={SUPPORT_FILTERS}
        onApply={setValues}
        onPageReset={() => setPage(1)}
        collapsible
      />

      {error ? (
        <ErrorState
          title="Impossible de charger les tickets"
          message={getErrorMessage(error)}
          onRetry={execute}
        />
      ) : isLoading ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Aucun ticket"
          description="Aucun ticket ne correspond à ces filtres."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernier message</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="max-w-[320px] truncate font-medium">
                      {t.subject}
                    </TableCell>
                    <TableCell className="text-sm">
                      {t.user
                        ? `${t.user.first_name} ${t.user.last_name}`
                        : t.user_id}
                    </TableCell>
                    <TableCell className="text-sm">
                      {SUPPORT_CATEGORY_LABELS[t.category] ?? t.category}
                    </TableCell>
                    <TableCell>
                      <Badge variant={variantOf(t.status)}>
                        {SUPPORT_STATUS_LABELS[t.status] ?? t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(t.last_message_at ?? t.created_at)}
                    </TableCell>
                    <TableCell>
                      <Link href={`${ROUTES.SUPPORT}/${t.id}`}>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
