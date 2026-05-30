"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Lock, Wallet as WalletIcon } from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { ErrorState } from "@/presentation/components/shared/error";
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
import { walletService } from "@/presentation/services/wallet";
import { ROUTES } from "@/lib/constants";
import {
  WALLET_TX_CATEGORY_LABELS,
  WALLET_TX_STATUS_LABELS,
  WalletMovement,
  WalletTxStatus,
} from "@/lib/enums";
import { formatCurrency, formatDateTime } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { WalletUserView } from "@/lib/types";

export default function PlatformWalletPage() {
  const fetchPlatform = useCallback(
    () => walletService.getPlatformWallet(),
    [],
  );
  const { data, isLoading, error, execute } =
    useAsync<WalletUserView>(fetchPlatform);

  useRealtime(["wallet.updated", "wallet.transaction.updated"], () => {
    void execute();
  });

  if (error) {
    return <ErrorState message={getErrorMessage(error)} onRetry={execute} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portefeuille plateforme"
        description="Compte « maison » utilisé comme escrow pour tous les flux internes. Historique complet ci-dessous."
        actions={
          <Button asChild variant="outline">
            <Link href={ROUTES.WALLETS}>
              <ArrowLeft className="size-4" />
              Retour aux portefeuilles
            </Link>
          </Button>
        }
      />

      <Card className="border-secondary/40 bg-secondary-soft/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <Building2 className="size-6" />
            </span>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Compte système Kwetche</h2>
                <Badge variant="outline">Plateforme</Badge>
              </div>
              {isLoading || !data ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Stat
                    icon={WalletIcon}
                    label="Solde"
                    value={formatCurrency(
                      data.wallet.balance,
                      data.wallet.currency,
                    )}
                  />
                  <Stat
                    icon={Lock}
                    label="Bloqué"
                    value={formatCurrency(
                      data.wallet.locked_balance,
                      data.wallet.currency,
                    )}
                  />
                  <Stat
                    icon={WalletIcon}
                    label="Disponible"
                    value={formatCurrency(
                      data.wallet.available,
                      data.wallet.currency,
                    )}
                    highlight
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading && !data ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Mouvement</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Solde après</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Référence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data || data.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted">
                      Aucune transaction enregistrée.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs">
                        {formatDateTime(tx.created_at)}
                      </TableCell>
                      <TableCell>
                        {WALLET_TX_CATEGORY_LABELS[tx.category] ?? tx.category}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.movement === WalletMovement.CREDIT
                              ? "secondary"
                              : "neutral"
                          }
                        >
                          {tx.movement === WalletMovement.CREDIT
                            ? "Crédit"
                            : "Débit"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(tx.amount, data.wallet.currency)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted">
                        {tx.balance_after != null
                          ? formatCurrency(
                              tx.balance_after,
                              data.wallet.currency,
                            )
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.status === WalletTxStatus.VALIDATED
                              ? "secondary"
                              : tx.status === WalletTxStatus.REJECTED
                                ? "danger"
                                : "neutral"
                          }
                        >
                          {WALLET_TX_STATUS_LABELS[tx.status] ?? tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted">
                        {tx.reference ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
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
