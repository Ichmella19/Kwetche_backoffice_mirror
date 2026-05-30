"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Eye,
  Lock,
  Search,
  Wallet as WalletIcon,
} from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { ErrorState } from "@/presentation/components/shared/error";
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
import { useAsync, useDebounce, useRealtime } from "@/presentation/hooks";
import { walletService } from "@/presentation/services/wallet";
import { ROLE_LABELS, ROUTES } from "@/lib/constants";
import { WALLET_STATUS_LABELS } from "@/lib/enums";
import {
  formatCurrency,
  formatPhone,
  fullName,
  getInitials,
} from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { WalletListResponse, WalletUserView } from "@/lib/types";

const PER_PAGE = 20;

export default function WalletsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  const fetchWallets = useCallback(
    () => walletService.list(page, PER_PAGE, debouncedSearch),
    [page, debouncedSearch],
  );
  const { data, isLoading, error, execute } =
    useAsync<WalletListResponse>(fetchWallets);

  const fetchPlatform = useCallback(
    () => walletService.getPlatformWallet(),
    [],
  );
  const {
    data: platform,
    isLoading: platformLoading,
    execute: reloadPlatform,
  } = useAsync<WalletUserView>(fetchPlatform);

  useRealtime(["wallet.updated", "wallet.transaction.updated"], () => {
    void execute();
    void reloadPlatform();
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PER_PAGE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portefeuilles"
        description="Compte plateforme et portefeuilles utilisateurs — séparés pour une comptabilité claire."
      />

      {/* ── Portefeuille plateforme (à part) ──────────── */}
      <PlatformWalletCard
        view={platform}
        isLoading={platformLoading}
      />

      {/* ── Portefeuilles utilisateurs ────────────────── */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Portefeuilles utilisateurs</h2>
          {data && (
            <span className="text-xs text-muted">
              {data.total} compte{data.total > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Input
                placeholder="Rechercher (nom, téléphone, email)…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                leadingIcon={<Search />}
              />
            </div>
          </CardContent>
        </Card>

        {error ? (
          <ErrorState message={getErrorMessage(error)} onRetry={execute} />
        ) : isLoading && !data ? (
          <Card>
            <CardContent className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="Aucun portefeuille"
            description={
              debouncedSearch
                ? "Aucun utilisateur ne correspond à cette recherche."
                : "Aucun portefeuille utilisateur."
            }
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Propriétaire</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead className="text-right">Solde</TableHead>
                    <TableHead className="text-right">Bloqué</TableHead>
                    <TableHead className="text-right">Disponible</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((w) => {
                    const owner = w.owner;
                    return (
                      <TableRow key={w.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9 shrink-0">
                              {owner?.profile_photo ? (
                                <AvatarImage
                                  src={owner.profile_photo}
                                  alt={fullName(
                                    owner.first_name,
                                    owner.last_name,
                                  )}
                                />
                              ) : null}
                              <AvatarFallback>
                                {getInitials(
                                  owner?.first_name,
                                  owner?.last_name,
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {fullName(
                                  owner?.first_name,
                                  owner?.last_name,
                                )}
                              </div>
                              <div className="truncate text-xs text-muted">
                                KYC niv. {owner?.kyc_level ?? 0}
                                {owner?.role &&
                                  owner.role !== "user" &&
                                  ` · ${ROLE_LABELS[owner.role] ?? owner.role}`}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {owner ? formatPhone(owner.phone, owner.country_code) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(w.balance, w.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(w.locked_balance, w.currency)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(w.available, w.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              w.status === "locked" ? "danger" : "secondary"
                            }
                          >
                            {WALLET_STATUS_LABELS[w.status] ?? w.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`${ROUTES.WALLETS}/${w.user_id}`}>
                              <Eye className="size-4" />
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
      </section>

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

function PlatformWalletCard({
  view,
  isLoading,
}: {
  view: WalletUserView | null;
  isLoading: boolean;
}) {
  return (
    <Card className="border-secondary/40 bg-secondary-soft/30">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <Building2 className="size-6" />
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">
                  Portefeuille plateforme
                </h3>
                <Badge variant="outline">Compte système</Badge>
              </div>
              <p className="text-sm text-muted">
                Compte « maison » utilisé comme escrow pour les flux tontine.
                N'appartient à personne physique — son solde reflète le passif
                net de la plateforme envers ses utilisateurs.
              </p>
            </div>

            {isLoading || !view ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <PlatformStat
                  icon={WalletIcon}
                  label="Solde"
                  value={formatCurrency(view.wallet.balance, view.wallet.currency)}
                />
                <PlatformStat
                  icon={Lock}
                  label="Bloqué"
                  value={formatCurrency(
                    view.wallet.locked_balance,
                    view.wallet.currency,
                  )}
                />
                <PlatformStat
                  icon={WalletIcon}
                  label="Disponible"
                  value={formatCurrency(
                    view.wallet.available,
                    view.wallet.currency,
                  )}
                  highlight
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-muted">
                {view && view.transactions.length > 0
                  ? `${view.total} transactions au total`
                  : "Aucune transaction pour l'instant"}
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href={`${ROUTES.WALLETS}/platform`}>
                  Voir l'historique
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformStat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof WalletIcon;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        <Icon className="size-4 text-muted" />
      </div>
      <div
        className={
          highlight
            ? "mt-1 text-xl font-semibold"
            : "mt-1 text-base font-medium"
        }
      >
        {value}
      </div>
    </div>
  );
}
