"use client";

import { use, useCallback, useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { ErrorState } from "@/presentation/components/shared/error";
import { ConfirmDialog } from "@/presentation/components/shared/confirm-dialog";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Field } from "@/presentation/components/ui/field";
import { Input } from "@/presentation/components/ui/input";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { Textarea } from "@/presentation/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/components/ui/table";
import { useAsync, useRealtime, useToast } from "@/presentation/hooks";
import { walletService } from "@/presentation/services/wallet";
import {
  WALLET_STATUS_LABELS,
  WALLET_TX_CATEGORY_LABELS,
  WALLET_TX_STATUS_LABELS,
  WalletMovement,
  WalletTxStatus,
} from "@/lib/enums";
import { formatCurrency, formatDateTime } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { WalletTransaction, WalletUserView } from "@/lib/types";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default function WalletDetailPage({ params }: PageProps) {
  const { userId } = use(params);
  const toast = useToast();

  const fetchWallet = useCallback(
    () => walletService.getForUser(userId),
    [userId],
  );
  const { data, isLoading, error, execute } =
    useAsync<WalletUserView>(fetchWallet);

  // Refresh live sur ce wallet (solde + tx) — déclenché par tout changement
  // wallet/tx côté user (pending depuis le mobile, validation backend…).
  useRealtime(
    ["wallet.updated", "wallet.transaction.updated"],
    (msg) => {
      // Filtre : on ne reload que si l'event concerne CE user
      const evtUserId =
        (msg.data?.user_id as string | undefined) ??
        (msg.data?.wallet as { user_id?: string } | undefined)?.user_id;
      if (!evtUserId || evtUserId === userId) {
        void execute();
      }
    },
  );

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustDirection, setAdjustDirection] = useState<"credit" | "debit">(
    "credit",
  );
  const [busy, setBusy] = useState(false);

  const openAdjust = (direction: "credit" | "debit") => {
    setAdjustDirection(direction);
    setAdjustAmount("");
    setAdjustReason("");
    setAdjustOpen(true);
  };

  const submitAdjust = async () => {
    const amount = Number(adjustAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Montant invalide", "Saisissez un montant > 0.");
      return;
    }
    if (adjustReason.trim().length < 3) {
      toast.error("Motif requis", "Indiquez la raison de l'ajustement.");
      return;
    }
    setBusy(true);
    try {
      await walletService.adjust(userId, {
        amount,
        direction: adjustDirection,
        reason: adjustReason,
      });
      toast.success("Ajustement enregistré.");
      setAdjustOpen(false);
      await execute();
    } catch (err) {
      toast.error("Échec de l'ajustement", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onConfirmTx = async (tx: WalletTransaction) => {
    setBusy(true);
    try {
      await walletService.confirmTransaction(tx.id);
      toast.success("Transaction confirmée.");
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onRejectTx = async (tx: WalletTransaction) => {
    setBusy(true);
    try {
      await walletService.rejectTransaction(tx.id);
      toast.success("Transaction rejetée.");
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return <ErrorState message={getErrorMessage(error)} onRetry={execute} />;
  }
  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const w = data.wallet;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portefeuille"
        description={`Utilisateur ${userId}`}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => openAdjust("credit")} variant="outline">
              <Plus className="mr-2 size-4" /> Créditer
            </Button>
            <Button onClick={() => openAdjust("debit")} variant="outline">
              <Minus className="mr-2 size-4" /> Débiter
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-4">
          <Stat label="Solde" value={formatCurrency(w.balance, w.currency)} />
          <Stat
            label="Bloqué"
            value={formatCurrency(w.locked_balance, w.currency)}
          />
          <Stat
            label="Disponible"
            value={formatCurrency(w.available, w.currency)}
            highlight
          />
          <Stat
            label="Statut"
            value={WALLET_STATUS_LABELS[w.status] ?? w.status}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Mouvement</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted">
                    Aucune transaction.
                  </TableCell>
                </TableRow>
              )}
              {data.transactions.map((tx) => (
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
                    {formatCurrency(tx.amount, w.currency)}
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
                  <TableCell>
                    {tx.status === WalletTxStatus.PENDING && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => onConfirmTx(tx)}
                          aria-label="Confirmer"
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => onRejectTx(tx)}
                          aria-label="Rejeter"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        title={`Ajuster (${adjustDirection === "credit" ? "crédit" : "débit"})`}
        description="Ajustement manuel agent. Tracé dans le ledger."
        confirmLabel="Enregistrer"
        confirmVariant="accent"
        isLoading={busy}
        onConfirm={submitAdjust}
      >
        <Field label="Montant" htmlFor="adjust-amount" required>
          <Input
            id="adjust-amount"
            type="number"
            min={1}
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
          />
        </Field>
        <Field label="Motif" htmlFor="adjust-reason" required>
          <Textarea
            id="adjust-reason"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="Ex : remboursement litige #1234"
            maxLength={500}
          />
        </Field>
      </ConfirmDialog>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div
        className={
          highlight ? "text-2xl font-semibold" : "text-lg font-medium"
        }
      >
        {value}
      </div>
    </div>
  );
}
