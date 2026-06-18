"use client";

import { useEffect, useMemo, useState } from "react";
import type { BadgeProps } from "@/presentation/components/ui/badge";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Field } from "@/presentation/components/ui/field";
import { Input } from "@/presentation/components/ui/input";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { useAsync, useToast } from "@/presentation/hooks";
import { useAuth } from "@/presentation/contexts/auth-context";
import { walletService } from "@/presentation/services/wallet";
import {
  Grant,
  WALLET_TX_CATEGORY_LABELS,
  WALLET_TX_STATUS_LABELS,
  WalletTxStatus,
} from "@/lib/enums";
import { formatCurrency } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { WalletUserView } from "@/lib/types";
import { Stat } from "./Stat";

function walletTxStatusVariant(status: string): BadgeProps["variant"] {
  if (status === WalletTxStatus.VALIDATED) return "success";
  if (status === WalletTxStatus.PENDING) return "warning";
  return "danger";
}

export function WalletCard({ userId }: { userId: string }) {
  const toast = useToast();
  const { hasGrant } = useAuth();
  const canAdjust = hasGrant(Grant.WALLET_ADJUST);

  const fetchWallet = useMemo(
    () => () => walletService.getForUser(userId),
    [userId],
  );
  const { data, isLoading, error, execute } = useAsync<WalletUserView>(
    fetchWallet,
    false,
  );

  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [txBusyId, setTxBusyId] = useState<string | null>(null);

  useEffect(() => {
    execute().catch(() => undefined);
  }, [execute]);

  if (!hasGrant(Grant.WALLET_READ)) return null;

  const adjust = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Montant invalide", "Indiquez un montant positif.");
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("Motif requis", "Justifiez l'ajustement.");
      return;
    }
    setBusy(true);
    try {
      await walletService.adjust(userId, { amount: value, direction, reason });
      toast.success("Wallet ajusté");
      setAmount("");
      setReason("");
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const reviewTx = async (txId: string, confirm: boolean) => {
    setTxBusyId(txId);
    try {
      if (confirm) await walletService.confirmTransaction(txId);
      else await walletService.rejectTransaction(txId);
      toast.success(confirm ? "Transaction confirmée" : "Transaction rejetée");
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setTxBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet</CardTitle>
        <CardDescription>
          Solde, historique et ajustement manuel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading && !data ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : error || !data ? (
          <p className="text-sm text-muted">{error ?? "Wallet indisponible."}</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat
                label="Disponible"
                value={formatCurrency(data.wallet.available)}
              />
              <Stat
                label="Total"
                value={formatCurrency(data.wallet.balance)}
              />
              <Stat
                label="Bloqué"
                value={formatCurrency(data.wallet.locked_balance)}
              />
            </div>

            {canAdjust && (
              <div className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-2">
                <Field label="Montant (XOF)">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </Field>
                <Field label="Sens">
                  <div className="flex gap-2">
                    {(["credit", "debit"] as const).map((d) => (
                      <Button
                        key={d}
                        type="button"
                        size="sm"
                        variant={direction === d ? "accent" : "outline"}
                        onClick={() => setDirection(d)}
                      >
                        {d === "credit" ? "Créditer" : "Débiter"}
                      </Button>
                    ))}
                  </div>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Motif">
                    <Input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Button
                    onClick={adjust}
                    isLoading={busy}
                    disabled={!amount || !reason.trim()}
                  >
                    Ajuster le wallet
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Transactions récentes
              </p>
              {data.transactions.length === 0 ? (
                <p className="text-sm text-muted">Aucune transaction.</p>
              ) : (
                data.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {WALLET_TX_CATEGORY_LABELS[tx.category] ?? tx.category}
                        <span
                          className={
                            tx.movement === "credit"
                              ? "ml-2 text-success"
                              : "ml-2 text-danger"
                          }
                        >
                          {tx.movement === "credit" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </p>
                      {tx.description && (
                        <p className="text-xs text-muted">{tx.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={walletTxStatusVariant(tx.status)}>
                        {WALLET_TX_STATUS_LABELS[tx.status] ?? tx.status}
                      </Badge>
                      {canAdjust && tx.status === WalletTxStatus.PENDING && (
                        <>
                          <Button
                            variant="accent"
                            size="sm"
                            isLoading={txBusyId === tx.id}
                            onClick={() => reviewTx(tx.id, true)}
                          >
                            Confirmer
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            isLoading={txBusyId === tx.id}
                            onClick={() => reviewTx(tx.id, false)}
                          >
                            Rejeter
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
