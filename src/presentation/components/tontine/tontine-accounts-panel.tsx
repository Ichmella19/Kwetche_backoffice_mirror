"use client";

import { useCallback, useMemo, useState } from "react";
import { Download, Landmark, Lock, PiggyBank, Wallet } from "lucide-react";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
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
import { useAsync } from "@/presentation/hooks";
import { tontineService } from "@/presentation/services/tontine";
import { formatCurrency, formatDateTime } from "@/lib/utils/formatters";
import type { InternalLedgerResponse, TontineAccounts } from "@/lib/types";

const PURPOSE_META: Record<
  string,
  { label: string; icon: typeof Wallet }
> = {
  pot: { label: "Pot (cagnotte)", icon: Wallet },
  reserve: { label: "Réserve", icon: PiggyBank },
  cautions: { label: "Cautions", icon: Lock },
};

const PURPOSE_OPTIONS = [
  { value: "", label: "Tous les comptes" },
  { value: "pot", label: "Pot" },
  { value: "reserve", label: "Réserve" },
  { value: "cautions", label: "Cautions" },
];

const MOVEMENT_OPTIONS = [
  { value: "", label: "Tous mouvements" },
  { value: "credit", label: "Entrées (crédit)" },
  { value: "debit", label: "Sorties (débit)" },
];

function purposeLabel(p: string): string {
  return PURPOSE_META[p]?.label ?? p;
}

export function TontineAccountsPanel({
  tontineId,
  accounts,
  currency,
}: {
  tontineId: string;
  accounts?: TontineAccounts;
  currency: string;
}) {
  const [purpose, setPurpose] = useState("");
  const [movement, setMovement] = useState("");

  const fetchLedger = useCallback(
    () =>
      tontineService.ledger(tontineId, {
        perPage: 200,
        purpose: purpose || undefined,
        movement: movement || undefined,
      }),
    [tontineId, purpose, movement],
  );
  const { data, isLoading } = useAsync<InternalLedgerResponse>(fetchLedger);

  const cards = useMemo(
    () =>
      accounts
        ? ([accounts.pot, accounts.reserve, accounts.cautions] as const)
        : [],
    [accounts],
  );

  function exportCsv() {
    const rows = data?.items ?? [];
    const header = [
      "date", "compte", "mouvement", "montant", "solde_apres",
      "reference", "description",
    ];
    const lines = rows.map((r) =>
      [
        r.created_at ?? "",
        purposeLabel(r.purpose),
        r.movement,
        r.amount,
        r.balance_after,
        r.reference ?? "",
        (r.description ?? "").replace(/[\n;]/g, " "),
      ].join(";"),
    );
    const csv = [header.join(";"), ...lines].join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tontine_${tontineId}_releve.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Landmark className="size-4" />
        <CardTitle className="text-base">Comptes & flux financiers</CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={exportCsv}
          disabled={!data || data.items.length === 0}
        >
          <Download className="size-4" />
          Exporter le relevé
        </Button>
      </CardHeader>
      <CardContent className="space-y-5 px-5 pb-5">
        {/* Soldes des 3 comptes internes */}
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((acct) => {
            const meta = PURPOSE_META[acct.purpose];
            const Icon = meta?.icon ?? Wallet;
            return (
              <div
                key={acct.id}
                className="rounded-lg border bg-card p-4"
              >
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Icon className="size-4" />
                  {meta?.label ?? acct.purpose}
                </div>
                <p className="mt-1 text-xl font-semibold">
                  {formatCurrency(acct.balance, acct.currency || currency)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filtres relevé */}
        <div className="flex flex-wrap gap-3">
          <Select
            value={purpose}
            options={PURPOSE_OPTIONS}
            onChange={(e) => setPurpose(e.target.value)}
            aria-label="Filtrer par compte"
            className="sm:w-48"
          />
          <Select
            value={movement}
            options={MOVEMENT_OPTIONS}
            onChange={(e) => setMovement(e.target.value)}
            aria-label="Filtrer par mouvement"
            className="sm:w-48"
          />
          <span className="ml-auto self-center text-sm text-muted">
            {data ? `${data.total} mouvement(s)` : ""}
          </span>
        </div>

        {/* Relevé */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Aucun mouvement enregistré.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead>Mouvement</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Solde après</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Libellé</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((r) => {
                  const credit = r.movement === "credit";
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted">
                        {formatDateTime(r.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{purposeLabel(r.purpose)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={credit ? "accent" : "neutral"}>
                          {credit ? "Crédit" : "Débit"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${credit ? "text-emerald-600" : "text-amber-600"}`}
                      >
                        {credit ? "+" : "−"}
                        {formatCurrency(r.amount, currency)}
                      </TableCell>
                      <TableCell className="text-right text-muted">
                        {formatCurrency(r.balance_after, currency)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.reference ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate text-sm text-muted">
                        {r.description ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
