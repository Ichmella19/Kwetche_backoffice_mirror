"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock, Search, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { ErrorState } from "@/presentation/components/shared/error";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { Pagination } from "@/presentation/components/shared/pagination";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/presentation/components/ui/avatar";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
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
import { kycService } from "@/presentation/services/kyc";
import { ROUTES } from "@/lib/constants";
import { getInitials } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { KycDossierListResponse } from "@/lib/types";

const PER_PAGE = 20;

// Onglets de statut — même pattern que la revue identité (N1).
const STATUS_TABS = [
  { value: "pending", label: "En attente" },
  { value: "approved", label: "Approuvés" },
  { value: "declined", label: "Refusés" },
  { value: "blocked", label: "Bloqués" },
  { value: "expired", label: "Expirés" },
  { value: "all", label: "Tous" },
] as const;

function relativeAge(iso: string | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  const ms = Date.now() - t;
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} j`;
}

function ageVariant(iso: string | null): "danger" | "warning" | "neutral" {
  if (!iso) return "neutral";
  const ms = Date.now() - Date.parse(iso);
  const days = ms / (24 * 3600_000);
  if (days >= 3) return "danger";
  if (days >= 1) return "warning";
  return "neutral";
}

function StatusTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filtrer les dossiers par statut"
      className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-1"
    >
      {STATUS_TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={[
              "shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted hover:bg-muted-soft hover:text-foreground",
            ].join(" ")}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

interface DossierListProps {
  level: 2 | 3;
  title: string;
  description: string;
}

export function DossierList({ level, title, description }: DossierListProps) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("pending");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Debounce de la recherche.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const fetchDossiers = useCallback(
    () =>
      kycService.listDossiers(level, {
        page,
        perPage: PER_PAGE,
        status,
        search: search || undefined,
        sort: "oldest",
      }),
    [level, page, status, search],
  );

  const { data, isLoading, error, execute } =
    useAsync<KycDossierListResponse>(fetchDossiers);

  // Refresh live à la soumission d'un document KYC.
  useRealtime(["kyc.document.submitted", "kyc.level.changed"], () => {
    void execute();
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / PER_PAGE)),
    [data?.total],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Badge variant="neutral" className="gap-1">
            <ShieldCheck className="size-3.5" />
            Niveau {level}
          </Badge>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusTabs
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nom, téléphone, email…"
            className="pl-9"
          />
        </div>
      </div>

      {error ? (
        <ErrorState
          title="Impossible de charger les dossiers"
          message={getErrorMessage(error)}
          onRetry={execute}
        />
      ) : isLoading ? (
        <Card>
          <CardContent className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Aucun dossier"
          description={
            status === "pending"
              ? "Aucun dossier en attente de traitement pour ce niveau."
              : "Aucun dossier ne correspond à ce statut."
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Niveau actuel</TableHead>
                  <TableHead>À examiner</TableHead>
                  <TableHead>Plus ancien</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((d) => {
                  const u = d.user;
                  const reviewUrl =
                    level === 2
                      ? `${ROUTES.KYC_N2}/${u.id}`
                      : `${ROUTES.KYC_N3}/${u.id}`;
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Link
                          href={reviewUrl}
                          className="flex items-center gap-3 transition-colors hover:text-primary"
                        >
                          <Avatar className="size-9">
                            {u.profile_photo ? (
                              <AvatarImage src={u.profile_photo} alt="" />
                            ) : null}
                            <AvatarFallback className="text-xs">
                              {getInitials(u.first_name, u.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {u.first_name} {u.last_name}
                            </p>
                            {d.is_entrepreneur ? (
                              <span className="text-xs text-amber-600">
                                Entrepreneur (IFU/RCCM)
                              </span>
                            ) : null}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted">
                        <p>
                          {u.country_code} {u.phone}
                        </p>
                        {u.email ? (
                          <p className="text-xs">{u.email}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">N{u.kyc_level}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {d.pending_docs > 0 ? (
                            <Badge variant="warning">
                              {d.pending_docs} doc{d.pending_docs > 1 ? "s" : ""}
                            </Badge>
                          ) : null}
                          <Badge variant={d.structured_ready ? "accent" : "neutral"}>
                            {level === 2 ? "Revenus" : "Banque"}{" "}
                            {d.structured_ready ? "✓" : "—"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Clock className="size-3" />
                          <Badge variant={ageVariant(d.oldest_submission_at)}>
                            {relativeAge(d.oldest_submission_at)}
                          </Badge>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={reviewUrl}>
                            Examiner
                            <ChevronRight className="size-3" />
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

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
