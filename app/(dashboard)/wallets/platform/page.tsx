"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CircleDollarSign,
  Coins,
  Landmark,
  TrendingDown,
  Wallet as WalletIcon,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { ErrorState } from "@/presentation/components/shared/error";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { Pagination } from "@/presentation/components/shared/pagination";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Select } from "@/presentation/components/ui/select";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { Textarea } from "@/presentation/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/components/ui/table";
import { useAsync, useToast } from "@/presentation/hooks";
import { useAuth } from "@/presentation/contexts/auth-context";
import { platformWalletService } from "@/presentation/services/platform-wallet";
import {
  PLATFORM_ACCOUNT_LABELS,
  PLATFORM_MOVEMENT_LABELS,
  PlatformAccount,
  PlatformMovement,
  UserRole,
} from "@/lib/enums";
import { formatCurrency, formatDateTime } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type {
  PlatformWallet,
  PlatformWalletTransactionsResponse,
} from "@/lib/types";

const TX_PER_PAGE = 25;

const ACCOUNT_META: Record<
  string,
  { icon: LucideIcon; tone: "primary" | "secondary" | "warning" | "info" | "danger"; tagline: string }
> = {
  [PlatformAccount.EARNINGS]: {
    icon: CircleDollarSign,
    tone: "secondary",
    tagline: "Gains nets (résiduel réserve, dettes hors-tontine)",
  },
  [PlatformAccount.TONTINES_IMPAYES]: {
    icon: TrendingDown,
    tone: "danger",
    tagline: "Pertes (dettes write-off)",
  },
  [PlatformAccount.OPERATIONAL]: {
    icon: Landmark,
    tone: "info",
    tagline: "Trésorerie opérationnelle",
  },
  [PlatformAccount.LOANS]: {
    icon: Coins,
    tone: "info",
    tagline: "Capital prêts (futur)",
  },
};

const MOVEMENT_OPTIONS = [
  { value: "", label: "Tous les mouvements" },
  { value: PlatformMovement.CREDIT, label: PLATFORM_MOVEMENT_LABELS[PlatformMovement.CREDIT] },
  { value: PlatformMovement.DEBIT, label: PLATFORM_MOVEMENT_LABELS[PlatformMovement.DEBIT] },
];

type AdjustMode = "credit" | "debit";

export default function PlatformWalletsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  // ── Liste des 7 comptes ─────────────────────────────────────────
  const fetchWallets = useCallback(() => platformWalletService.list(), []);
  const {
    data: wallets,
    isLoading: walletsLoading,
    error: walletsError,
    execute: reloadWallets,
  } = useAsync<PlatformWallet[]>(fetchWallets);

  const totalAcrossAccounts = useMemo(
    () => (wallets ?? []).reduce((s, w) => s + (w.balance ?? 0), 0),
    [wallets],
  );

  // ── Compte sélectionné pour l'historique ────────────────────────
  const [selectedPurpose, setSelectedPurpose] = useState<string>(
    PlatformAccount.EARNINGS,
  );
  const [movement, setMovement] = useState<string>("");
  const [page, setPage] = useState(1);

  const fetchTx = useCallback(
    () =>
      platformWalletService.transactions(selectedPurpose, {
        page,
        perPage: TX_PER_PAGE,
        movement: (movement || undefined) as "credit" | "debit" | undefined,
      }),
    [selectedPurpose, page, movement],
  );
  const {
    data: txData,
    isLoading: txLoading,
    error: txError,
    execute: reloadTx,
  } = useAsync<PlatformWalletTransactionsResponse>(fetchTx);

  const totalPages = Math.max(
    1,
    Math.ceil((txData?.total ?? 0) / TX_PER_PAGE),
  );

  // ── Ajustement manuel super_admin ──────────────────────────────
  const [adjust, setAdjust] = useState<{
    mode: AdjustMode;
    purpose: string;
  } | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const openAdjust = (mode: AdjustMode, purpose: string) => {
    setAdjust({ mode, purpose });
    setAmount("");
    setDescription("");
  };

  const submitAdjust = async () => {
    if (!adjust) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Montant invalide", "Le montant doit être > 0.");
      return;
    }
    if (description.trim().length < 3) {
      toast.error(
        "Description manquante",
        "Donnez un motif clair (≥ 3 caractères).",
      );
      return;
    }
    setBusy(true);
    try {
      const op =
        adjust.mode === "credit"
          ? platformWalletService.credit
          : platformWalletService.debit;
      await op.call(platformWalletService, adjust.purpose, {
        amount: Math.round(value),
        description: description.trim(),
      });
      toast.success(
        adjust.mode === "credit" ? "Crédit enregistré" : "Débit enregistré",
      );
      setAdjust(null);
      void reloadWallets();
      if (adjust.purpose === selectedPurpose) void reloadTx();
    } catch (err) {
      toast.error("Échec de l'opération", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comptes plateforme"
        description="7 comptes de réserve catégorisés — vue analytique et historique."
      />

      {/* Total global */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">
              Total cumulé tous comptes
            </p>
            {walletsLoading ? (
              <Skeleton className="mt-2 h-8 w-48" />
            ) : (
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {formatCurrency(totalAcrossAccounts)}
              </p>
            )}
          </div>
          <Badge variant="neutral">{wallets?.length ?? 0} compte(s)</Badge>
        </CardContent>
      </Card>

      {/* Grille des 7 comptes */}
      {walletsError ? (
        <ErrorState
          message={getErrorMessage(walletsError)}
          onRetry={reloadWallets}
        />
      ) : walletsLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : !wallets || wallets.length === 0 ? (
        <EmptyState
          icon={WalletIcon}
          title="Aucun compte plateforme"
          description="Le seeder n'a pas encore créé les comptes."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {wallets.map((w) => {
            const meta = ACCOUNT_META[w.purpose] ?? {
              icon: WalletIcon,
              tone: "info" as const,
              tagline: "",
            };
            const Icon = meta.icon;
            const selected = w.purpose === selectedPurpose;
            return (
              <Card
                key={w.id}
                className={selected ? "ring-2 ring-primary" : undefined}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="size-5 text-muted" />
                      <Badge variant={meta.tone}>
                        {PLATFORM_ACCOUNT_LABELS[w.purpose] ?? w.purpose}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-semibold tabular-nums">
                      {formatCurrency(w.balance, w.currency)}
                    </p>
                    <p className="text-xs text-muted">{meta.tagline}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={selected ? "primary" : "outline"}
                      onClick={() => {
                        setSelectedPurpose(w.purpose);
                        setPage(1);
                      }}
                    >
                      Historique
                    </Button>
                    {isSuperAdmin ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openAdjust("credit", w.purpose)}
                          title="Créditer (super_admin)"
                        >
                          <ArrowUpCircle className="size-4 text-success" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openAdjust("debit", w.purpose)}
                          title="Débiter (super_admin)"
                        >
                          <ArrowDownCircle className="size-4 text-danger" />
                        </Button>
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Historique du compte sélectionné */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Banknote className="size-5 text-primary" />
            Historique —{" "}
            {PLATFORM_ACCOUNT_LABELS[selectedPurpose] ?? selectedPurpose}
            {txData ? <Badge variant="neutral">{txData.total}</Badge> : null}
          </h2>
          <div className="flex items-center gap-2">
            <Select
              value={movement}
              onChange={(e) => {
                setMovement(e.target.value);
                setPage(1);
              }}
              options={MOVEMENT_OPTIONS}
              aria-label="Filtrer par mouvement"
              className="w-48"
            />
          </div>
        </div>

        {txError ? (
          <ErrorState message={getErrorMessage(txError)} onRetry={reloadTx} />
        ) : txLoading ? (
          <Card>
            <CardContent className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        ) : !txData || txData.items.length === 0 ? (
          <EmptyState
            title="Aucun mouvement"
            description="Ce compte n'a pas encore reçu d'écriture."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sens</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Solde après</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Lien</TableHead>
                    <TableHead>Auteur</TableHead>
                    <TableHead>Quand</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txData.items.map((tx) => {
                    const credit = tx.movement === PlatformMovement.CREDIT;
                    return (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Badge
                            variant={credit ? "secondary" : "danger"}
                            className="gap-1"
                          >
                            {credit ? (
                              <ArrowUpCircle className="size-3.5" />
                            ) : (
                              <ArrowDownCircle className="size-3.5" />
                            )}
                            {PLATFORM_MOVEMENT_LABELS[tx.movement]}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={
                            credit
                              ? "font-medium text-success"
                              : "font-medium text-danger"
                          }
                        >
                          {credit ? "+" : "−"}
                          {formatCurrency(tx.amount, txData.wallet.currency)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatCurrency(
                            tx.balance_after,
                            txData.wallet.currency,
                          )}
                        </TableCell>
                        <TableCell className="max-w-[280px] truncate text-sm">
                          {tx.description ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted">
                          {tx.related_type && tx.related_id
                            ? `${tx.related_type}:${tx.related_id.slice(0, 8)}…`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted">
                          {tx.is_automatic ? (
                            <Badge variant="neutral">auto</Badge>
                          ) : (
                            (tx.performed_by ?? "—")
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted">
                          {formatDateTime(tx.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {totalPages > 1 ? (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        ) : null}
      </section>

      {/* Dialog d'ajustement manuel */}
      <Dialog open={!!adjust} onOpenChange={(o) => !o && setAdjust(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjust?.mode === "credit" ? "Créditer" : "Débiter"} —{" "}
              {adjust ? PLATFORM_ACCOUNT_LABELS[adjust.purpose] : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Montant (XOF)</Label>
              <Input
                id="amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Motif</Label>
              <Textarea
                id="desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Justification de l'écriture manuelle…"
                maxLength={1000}
              />
            </div>
            <p className="rounded-md bg-warning/10 p-2 text-xs text-warning">
              Action réservée au super_admin. L'écriture sera tracée dans
              l'historique du compte de manière permanente.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={busy}>
                Annuler
              </Button>
            </DialogClose>
            <Button
              variant={adjust?.mode === "debit" ? "danger" : "primary"}
              isLoading={busy}
              onClick={submitAdjust}
            >
              {adjust?.mode === "credit" ? "Créditer" : "Débiter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
