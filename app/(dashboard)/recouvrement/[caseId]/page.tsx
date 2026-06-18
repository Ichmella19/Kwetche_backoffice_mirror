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
import { Select } from "@/presentation/components/ui/select";
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
import { useAsync, useToast } from "@/presentation/hooks";
import { recouvrementService } from "@/presentation/services/recouvrement";
import { ROUTES } from "@/lib/constants";
import {
  DEBT_STATUS_LABELS,
  RECOUVREMENT_ACTION_TYPE_LABELS,
  RECOUVREMENT_CASE_STATUS_LABELS,
  RELANCE_CHANNEL_LABELS,
  RELANCE_STATUS_LABELS,
  RecouvrementActionType,
  RecouvrementCaseStatus,
} from "@/lib/enums";
import { formatCurrency, formatDateTime } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { RecouvrementCaseDetail } from "@/lib/types";

interface PageProps {
  params: Promise<{ caseId: string }>;
}

export default function RecouvrementCasePage({ params }: PageProps) {
  const { caseId } = use(params);
  const router = useRouter();
  const toast = useToast();

  const fetch = useCallback(
    () => recouvrementService.getCase(caseId),
    [caseId],
  );
  const { data, isLoading, error, execute } =
    useAsync<RecouvrementCaseDetail>(fetch);

  const [busy, setBusy] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState<string>(
    RecouvrementActionType.NOTE,
  );
  const [actionNote, setActionNote] = useState("");
  const [actionAmount, setActionAmount] = useState("");

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [writeOffOpen, setWriteOffOpen] = useState(false);
  const [writeOffNote, setWriteOffNote] = useState("");

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
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
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const c = data.case;
  const isPending = c.status === RecouvrementCaseStatus.PENDING_ASSIGNMENT;
  const isWorkable =
    c.status === RecouvrementCaseStatus.ASSIGNED ||
    c.status === RecouvrementCaseStatus.IN_PROGRESS ||
    c.status === RecouvrementCaseStatus.PARTIALLY_RECOVERED;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dossier ${caseId.slice(0, 8)}…`}
        description={`Utilisateur ${c.user_id}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {isPending && (
              <Button
                disabled={busy}
                onClick={() =>
                  run(
                    () => recouvrementService.assignSelf(caseId),
                    "Dossier assigné.",
                  )
                }
              >
                M&apos;assigner
              </Button>
            )}
            {isWorkable && (
              <>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setActionType(RecouvrementActionType.NOTE);
                    setActionNote("");
                    setActionAmount("");
                    setActionOpen(true);
                  }}
                >
                  Ajouter action
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setResolveNote("");
                    setResolveOpen(true);
                  }}
                >
                  Résoudre
                </Button>
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => {
                    setWriteOffNote("");
                    setWriteOffOpen(true);
                  }}
                >
                  Passer en perte
                </Button>
              </>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          <Stat
            label="Statut"
            value={RECOUVREMENT_CASE_STATUS_LABELS[c.status] ?? c.status}
          />
          <Stat label="Cible" value={formatCurrency(c.amount_target)} />
          <Stat label="Recouvré" value={formatCurrency(c.amount_recovered)} />
          <Stat label="Assigné à" value={c.assigned_agent_id ?? "—"} />
          <Stat label="Ouvert" value={formatDateTime(c.opened_at)} />
          <Stat label="Assigné" value={formatDateTime(c.assigned_at)} />
          <Stat label="Résolu" value={formatDateTime(c.resolved_at)} />
          <Stat label="Note" value={c.resolution_note ?? "—"} />
        </CardContent>
      </Card>

      {data.debt && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Dette</h2>
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
              <Stat
                label="Statut"
                value={DEBT_STATUS_LABELS[data.debt.status] ?? data.debt.status}
              />
              <Stat label="Dû" value={formatCurrency(data.debt.amount_due)} />
              <Stat
                label="Recouvré"
                value={formatCurrency(data.debt.amount_recovered)}
              />
              <Stat label="Restant" value={formatCurrency(data.debt.remaining)} />
              <Stat label="Origine" value={data.debt.origin_type ?? "—"} />
              <Stat label="Tontine" value={data.debt.tontine_id ?? "—"} />
              <Stat
                label="Relances"
                value={String(data.debt.relance_count ?? 0)}
              />
              <Stat
                label="Dernière relance"
                value={formatDateTime(data.debt.last_relance_at)}
              />
            </CardContent>
          </Card>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          Relances ({data.relances.length})
        </h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tentative</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Envoyée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.relances.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted">
                      Aucune relance.
                    </TableCell>
                  </TableRow>
                )}
                {data.relances.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>#{r.attempt_no}</TableCell>
                    <TableCell>
                      {RELANCE_CHANNEL_LABELS[r.channel] ?? r.channel}
                    </TableCell>
                    <TableCell>
                      <Badge>
                        {RELANCE_STATUS_LABELS[r.status] ?? r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDateTime(r.sent_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          Journal d&apos;actions ({data.actions.length})
        </h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.actions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted">
                      Aucune action.
                    </TableCell>
                  </TableRow>
                )}
                {data.actions.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs">
                      {formatDateTime(a.created_at)}
                    </TableCell>
                    <TableCell>
                      {RECOUVREMENT_ACTION_TYPE_LABELS[a.action_type] ??
                        a.action_type}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {a.agent_id}
                    </TableCell>
                    <TableCell className="text-right">
                      {a.amount ? formatCurrency(a.amount) : "—"}
                    </TableCell>
                    <TableCell>{a.note ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <div className="flex justify-end">
        <Button variant="ghost" onClick={() => router.push(ROUTES.RECOUVREMENT)}>
          Retour
        </Button>
      </div>

      <ConfirmDialog
        open={actionOpen}
        onOpenChange={setActionOpen}
        title="Ajouter une action"
        description="Journalise une étape du dossier."
        confirmLabel="Enregistrer"
        isLoading={busy}
        onConfirm={() =>
          run(
            () =>
              recouvrementService.addAction(caseId, {
                action_type: actionType,
                note: actionNote || undefined,
                amount:
                  actionType === RecouvrementActionType.PAYMENT_RECEIVED &&
                  actionAmount
                    ? Number(actionAmount)
                    : undefined,
              }),
            "Action enregistrée.",
          ).then(() => setActionOpen(false))
        }
      >
        <Field label="Type" htmlFor="action-type" required>
          <Select
            id="action-type"
            value={actionType}
            options={Object.values(RecouvrementActionType).map((v) => ({
              value: v,
              label: RECOUVREMENT_ACTION_TYPE_LABELS[v] ?? v,
            }))}
            onChange={(e) => setActionType(e.target.value)}
          />
        </Field>
        {actionType === RecouvrementActionType.PAYMENT_RECEIVED && (
          <Field label="Montant reçu (XOF)" htmlFor="action-amount" required>
            <Input
              id="action-amount"
              type="number"
              min={1}
              value={actionAmount}
              onChange={(e) => setActionAmount(e.target.value)}
            />
          </Field>
        )}
        <Field label="Note" htmlFor="action-note">
          <Textarea
            id="action-note"
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
            maxLength={2000}
          />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        title="Résoudre le dossier"
        description="Le dossier est marqué recouvré."
        confirmLabel="Résoudre"
        isLoading={busy}
        onConfirm={() =>
          run(
            () =>
              recouvrementService.resolve(caseId, {
                note: resolveNote || undefined,
              }),
            "Dossier résolu.",
          ).then(() => setResolveOpen(false))
        }
      >
        <Field label="Note (optionnelle)" htmlFor="resolve-note">
          <Textarea
            id="resolve-note"
            value={resolveNote}
            onChange={(e) => setResolveNote(e.target.value)}
            maxLength={2000}
          />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={writeOffOpen}
        onOpenChange={setWriteOffOpen}
        title="Passer en perte"
        description="La dette est marquée irrécouvrable."
        confirmLabel="Passer en perte"
        confirmVariant="danger"
        isLoading={busy}
        onConfirm={() =>
          run(
            () =>
              recouvrementService.writeOff(caseId, {
                note: writeOffNote || undefined,
              }),
            "Dossier classé en perte.",
          ).then(() => setWriteOffOpen(false))
        }
      >
        <Field label="Note (optionnelle)" htmlFor="writeoff-note">
          <Textarea
            id="writeoff-note"
            value={writeOffNote}
            onChange={(e) => setWriteOffNote(e.target.value)}
            maxLength={2000}
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
      <div className="font-medium break-words">{value}</div>
    </div>
  );
}
