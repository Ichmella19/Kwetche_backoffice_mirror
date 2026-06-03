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
const STATUS_OPTIONS = [
  { value: "", label: "Tous" },
  ...Object.values(SupportTicketStatus).map((v) => ({
    value: v,
    label: SUPPORT_STATUS_LABELS[v] ?? v,
  })),
];
const CATEGORY_OPTIONS = [
  { value: "", label: "Toutes" },
  ...Object.values(SupportTicketCategory).map((v) => ({
    value: v,
    label: SUPPORT_CATEGORY_LABELS[v] ?? v,
  })),
];

function variantOf(status: string): "secondary" | "danger" | "neutral" {
  if (status === SupportTicketStatus.RESOLVED) return "secondary";
  if (status === SupportTicketStatus.OPEN) return "danger";
  return "neutral";
}

export default function SupportListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  const fetchTickets = useCallback(
    () =>
      supportService.list({
        page,
        perPage: PER_PAGE,
        status: status || undefined,
        category: category || undefined,
      }),
    [page, status, category],
  );
  const { data, isLoading, error, execute } =
    useAsync<SupportTicketListResponse>(fetchTickets);

  // Refresh live : nouveau ticket ou MAJ via realtime admin.
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

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <Select
            value={status}
            options={STATUS_OPTIONS}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            aria-label="Filtrer par statut"
          />
          <Select
            value={category}
            options={CATEGORY_OPTIONS}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
            }}
            aria-label="Filtrer par catégorie"
          />
          <div className="flex items-center justify-end">
            <span className="text-sm text-muted-foreground">
              {data ? `${data.total} ticket(s)` : ""}
            </span>
          </div>
        </CardContent>
      </Card>

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
          description="Les demandes des utilisateurs apparaîtront ici."
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
                  <TableHead>Créé le</TableHead>
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
