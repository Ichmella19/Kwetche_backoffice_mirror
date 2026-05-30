"use client";

import { use, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { ErrorState } from "@/presentation/components/shared/error";
import { ConfirmDialog } from "@/presentation/components/shared/confirm-dialog";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Field } from "@/presentation/components/ui/field";
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
import { useAsync, useToast } from "@/presentation/hooks";
import { useAuth } from "@/presentation/contexts/auth-context";
import { tontineService } from "@/presentation/services/tontine";
import { recouvrementService } from "@/presentation/services/recouvrement";
import { ROUTES } from "@/lib/constants";
import {
  CAUTION_STATUS_LABELS,
  Grant,
  TONTINE_DRAW_MODE_LABELS,
  TONTINE_FREQUENCY_LABELS,
  TONTINE_MEMBER_STATUS_LABELS,
  TONTINE_STATUS_LABELS,
  TONTINE_TYPE_LABELS,
  TontineMemberStatus,
  TontineStatus,
} from "@/lib/enums";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { TontineDetail } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TontineDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { hasGrant } = useAuth();
  const canRelease = hasGrant(Grant.RECOUVREMENT_RESOLVE);

  const fetchDetail = useCallback(
    () => tontineService.detail(id),
    [id],
  );
  const { data, isLoading, error, execute } =
    useAsync<TontineDetail>(fetchDetail);

  const [busy, setBusy] = useState(false);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [postponeDate, setPostponeDate] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    label: string;
    description: string;
    fn: () => Promise<void>;
  } | null>(null);

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  };

  if (error) {
    return <ErrorState message={getErrorMessage(error)} onRetry={execute} />;
  }
  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const t = data.tontine;
  const isDraft = t.status === TontineStatus.DRAFT;
  const isOpenOrPending =
    t.status === TontineStatus.OPEN || t.status === TontineStatus.PENDING_START;
  const isActive = t.status === TontineStatus.ACTIVE;
  const canCancel =
    t.status === TontineStatus.OPEN ||
    t.status === TontineStatus.PENDING_START ||
    t.status === TontineStatus.ACTIVE;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.name}
        description={`Tontine ${id}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {isDraft && (
              <Button
                disabled={busy}
                onClick={() =>
                  setConfirmAction({
                    label: "Publier",
                    description:
                      "Ouvre les inscriptions. Visible des utilisateurs.",
                    fn: () =>
                      run(() => tontineService.publish(id), "Tontine publiée."),
                  })
                }
              >
                Publier
              </Button>
            )}
            {isOpenOrPending && (
              <>
                <Button
                  disabled={busy}
                  onClick={() =>
                    setConfirmAction({
                      label: "Démarrer",
                      description: "Lance la tontine avec les membres inscrits.",
                      fn: () =>
                        run(() => tontineService.start(id), "Tontine démarrée."),
                    })
                  }
                >
                  Démarrer
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setPostponeOpen(true)}
                >
                  Reporter
                </Button>
              </>
            )}
            {isActive && (
              <Button
                disabled={busy}
                onClick={() =>
                  setConfirmAction({
                    label: "Avancer le cycle",
                    description:
                      "Clôt le cycle courant (collect + payout) et ouvre le suivant.",
                    fn: () =>
                      run(() => tontineService.advance(id), "Cycle avancé."),
                  })
                }
              >
                Avancer cycle
              </Button>
            )}
            {canCancel && (
              <Button
                variant="danger"
                disabled={busy}
                onClick={() =>
                  setConfirmAction({
                    label: "Annuler",
                    description:
                      "Annule la tontine. Cautions débloquées, cotisations remboursées.",
                    fn: () =>
                      run(() => tontineService.cancel(id), "Tontine annulée."),
                  })
                }
              >
                Annuler
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          <Stat label="Statut" value={TONTINE_STATUS_LABELS[t.status] ?? t.status} />
          <Stat label="Type" value={TONTINE_TYPE_LABELS[t.type] ?? t.type} />
          <Stat
            label="Tirage"
            value={TONTINE_DRAW_MODE_LABELS[t.draw_mode] ?? t.draw_mode}
          />
          <Stat
            label="Fréquence"
            value={TONTINE_FREQUENCY_LABELS[t.frequency] ?? t.frequency}
          />
          <Stat
            label="Cotisation"
            value={formatCurrency(t.contribution_amount, t.currency)}
          />
          <Stat
            label="Caution"
            value={formatCurrency(t.caution_amount, t.currency)}
          />
          <Stat label="Commission" value={`${t.commission_rate}%`} />
          <Stat
            label="Membres"
            value={`${t.member_count ?? data.members.length}/${t.max_members}`}
          />
          <Stat label="Démarrage" value={formatDate(t.start_date) || "—"} />
          <Stat
            label="Cycle"
            value={
              t.current_cycle_index
                ? `${t.current_cycle_index}/${t.total_rounds ?? "—"}`
                : "—"
            }
          />
          <Stat
            label="Fond de réserve"
            value={formatCurrency(t.reserve_fund, t.currency)}
          />
          <Stat label="KYC min" value={`Niveau ${t.required_kyc_level}`} />
        </CardContent>
      </Card>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Membres ({data.members.length})</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Caution</TableHead>
                  <TableHead>Tour</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted">
                      Aucun membre.
                    </TableCell>
                  </TableRow>
                )}
                {data.members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">
                      {m.user_id}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          m.status === TontineMemberStatus.DEFAULTED
                            ? "danger"
                            : "neutral"
                        }
                      >
                        {TONTINE_MEMBER_STATUS_LABELS[m.status] ?? m.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(m.caution_amount, t.currency)} —{" "}
                      <span className="text-xs text-muted">
                        {CAUTION_STATUS_LABELS[m.caution_status] ??
                          m.caution_status}
                      </span>
                    </TableCell>
                    <TableCell>{m.payout_order ?? "—"}</TableCell>
                    <TableCell>
                      {m.status === TontineMemberStatus.DEFAULTED &&
                        canRelease && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              run(
                                () =>
                                  recouvrementService.releaseMember(m.id),
                                "Membre débloqué.",
                              )
                            }
                          >
                            Lever le blocage
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Cycles ({data.cycles.length})</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Bénéficiaire</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cycles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted">
                      Pas encore de cycles.
                    </TableCell>
                  </TableRow>
                )}
                {data.cycles.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.index}</TableCell>
                    <TableCell>{formatDate(c.due_date)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.is_platform_round
                        ? "Plateforme"
                        : c.beneficiary_member_id ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={c.status === "closed" ? "secondary" : "neutral"}
                      >
                        {c.status === "closed" ? "Clôturé" : "Ouvert"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <div className="flex justify-end">
        <Button variant="ghost" onClick={() => router.push(ROUTES.TONTINES)}>
          Retour
        </Button>
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction?.label ?? ""}
        description={confirmAction?.description ?? ""}
        confirmLabel={confirmAction?.label ?? "Confirmer"}
        isLoading={busy}
        onConfirm={() => confirmAction && void confirmAction.fn()}
      />

      <ConfirmDialog
        open={postponeOpen}
        onOpenChange={setPostponeOpen}
        title="Reporter le démarrage"
        description="Choisissez la nouvelle date de démarrage."
        confirmLabel="Reporter"
        isLoading={busy}
        onConfirm={() => {
          if (!postponeDate) {
            toast.error("Date requise", "Choisissez une date.");
            return;
          }
          void run(
            () => tontineService.postpone(id, postponeDate),
            "Date reportée.",
          ).then(() => setPostponeOpen(false));
        }}
      >
        <Field label="Nouvelle date" htmlFor="postpone-date" required>
          <Input
            id="postpone-date"
            type="date"
            value={postponeDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setPostponeDate(e.target.value)}
          />
        </Field>
      </ConfirmDialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
