"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Eye } from "lucide-react";
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
import { walletTransactionsService } from "@/presentation/services/wallet-transactions";
import { ROUTES } from "@/lib/constants";
import {
  WALLET_TX_CATEGORY_LABELS,
  WALLET_TX_STATUS_LABELS,
  WalletMovement,
  WalletTxStatus,
} from "@/lib/enums";
import { formatCurrency, formatDateTime } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { WalletTransactionsResponse } from "@/lib/types";
import type { BadgeProps } from "@/presentation/components/ui/badge";

const PER_PAGE = 50;

const CATEGORY_VALUES = [
  "deposit",
  "withdrawal",
  "contribution",
  "payout",
  "refund",
  "commission",
  "fee",
  "adjustment",
  "bonus",
  "debt_settlement",
];

const TX_FILTERS: FilterField[] = [
  {
    kind: "text",
    key: "reference",
    label: "Référence",
    placeholder: "Idempotency key, provider_ref…",
  },
  {
    kind: "multi",
    key: "movements",
    label: "Sens du flux",
    options: Object.values(WalletMovement).map((v) => ({
      value: v,
      label: v === WalletMovement.CREDIT ? "Crédit" : "Débit",
    })),
  },
  {
    kind: "multi",
    key: "statuses",
    label: "Statuts",
    options: Object.values(WalletTxStatus).map((v) => ({
      value: v,
      label: WALLET_TX_STATUS_LABELS[v] ?? v,
    })),
  },
  {
    kind: "multi",
    key: "categories",
    label: "Catégories",
    options: CATEGORY_VALUES.map((v) => ({
      value: v,
      label: WALLET_TX_CATEGORY_LABELS[v] ?? v,
    })),
  },
  {
    kind: "number-range",
    key: "amount",
    label: "Montant (XOF)",
    step: 100,
    unit: "XOF",
  },
  {
    kind: "date-range",
    key: "created",
    label: "Date de transaction",
  },
  {
    kind: "select",
    key: "sort",
    label: "Tri",
    placeholder: "Plus récent",
    options: [
      { value: "created_desc", label: "Plus récent" },
      { value: "created_asc", label: "Plus ancien" },
      { value: "amount_desc", label: "Montant (élevé d'abord)" },
      { value: "amount_asc", label: "Montant (faible d'abord)" },
    ],
  },
];

const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  [WalletTxStatus.PENDING]: "warning",
  [WalletTxStatus.VALIDATED]: "success",
  [WalletTxStatus.REJECTED]: "danger",
  [WalletTxStatus.CANCELLED]: "neutral",
};

export default function WalletTransactionsPage() {
  const [page, setPage] = useState(1);
  const [values, setValues] = useState<FilterValues>({});

  const fetchTx = useCallback(() => {
    const v = values;
    const asStr = (k: string) =>
      typeof v[k] === "string" ? (v[k] as string) : undefined;
    const asArr = (k: string) =>
      Array.isArray(v[k]) ? (v[k] as string[]) : undefined;
    const asNum = (k: string) => {
      const raw = asStr(k);
      if (raw === undefined) return undefined;
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined;
    };
    return walletTransactionsService.list({
      page,
      perPage: PER_PAGE,
      reference: asStr("reference"),
      movements: asArr("movements"),
      statuses: asArr("statuses"),
      categories: asArr("categories"),
      amountMin: asNum("amount_min"),
      amountMax: asNum("amount_max"),
      createdFrom: asStr("created_from"),
      createdTo: asStr("created_to"),
      sort: asStr("sort") ?? "created_desc",
    });
  }, [page, values]);

  const { data, isLoading, error, execute } =
    useAsync<WalletTransactionsResponse>(fetchTx);

  useRealtime(["wallet.transaction.updated"], () => {
    void execute();
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / PER_PAGE)),
    [data?.total],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions wallet"
        description="Historique transverse du ledger utilisateur, filtrable par catégorie, statut et référence."
      />

      <AdvancedFilters
        fields={TX_FILTERS}
        onApply={setValues}
        onPageReset={() => setPage(1)}
        collapsible
      />

      {error ? (
        <ErrorState
          title="Impossible de charger les transactions"
          message={getErrorMessage(error)}
          onRetry={execute}
        />
      ) : isLoading && !data ? (
        <Card>
          <CardContent className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Aucune transaction"
          description="Aucune transaction ne correspond à ces filtres."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Sens</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((tx) => {
                  const isCredit = tx.movement === WalletMovement.CREDIT;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(tx.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.user
                          ? `${tx.user.first_name} ${tx.user.last_name}`
                          : tx.user_id ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {WALLET_TX_CATEGORY_LABELS[tx.category] ?? tx.category}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 text-xs ${
                            isCredit ? "text-success" : "text-danger"
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="size-3.5" />
                          ) : (
                            <ArrowUpRight className="size-3.5" />
                          )}
                          {isCredit ? "Crédit" : "Débit"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(tx.amount, "XOF")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.reference ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[tx.status] ?? "neutral"}>
                          {WALLET_TX_STATUS_LABELS[tx.status] ?? tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tx.user_id ? (
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`${ROUTES.WALLETS}/${tx.user_id}`}>
                              <Eye className="size-4" />
                            </Link>
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data && data.total > PER_PAGE ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
