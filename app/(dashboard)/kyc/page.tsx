"use client";

import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { ErrorState } from "@/presentation/components/shared/error";
import { ConfirmDialog } from "@/presentation/components/shared/confirm-dialog";
import { Select } from "@/presentation/components/ui/select";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { Field } from "@/presentation/components/ui/field";
import { Textarea } from "@/presentation/components/ui/textarea";
import { KycDocumentCard } from "@/presentation/components/kyc/kyc-document-card";
import { useAsync, useToast } from "@/presentation/hooks";
import { useAuth } from "@/presentation/contexts/auth-context";
import { kycService } from "@/presentation/services/kyc";
import { Grant } from "@/lib/enums";
import { getErrorMessage } from "@/lib/utils/helpers";
import { KYC_DOCUMENT_LABELS } from "@/lib/constants";
import type { KycDocument } from "@/lib/types";

const LEVEL_OPTIONS = [
  { value: "", label: "Tous les niveaux" },
  { value: "1", label: "Niveau 1" },
  { value: "2", label: "Niveau 2" },
  { value: "3", label: "Niveau 3" },
];

type Action = "approve" | "reject";

export default function KycPage() {
  const toast = useToast();
  const { hasGrant } = useAuth();
  const [level, setLevel] = useState("");

  const canApprove = hasGrant(Grant.KYC_APPROVE);
  const canReject = hasGrant(Grant.KYC_REJECT);

  const fetchPending = useMemo(
    () => () => kycService.listPending(level ? Number(level) : undefined),
    [level],
  );
  const { data, isLoading, error, execute } = useAsync<KycDocument[]>(fetchPending);

  const [target, setTarget] = useState<KycDocument | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const openApprove = (doc: KycDocument) => {
    setTarget(doc);
    setAction("approve");
  };
  const openReject = (doc: KycDocument) => {
    setTarget(doc);
    setReason("");
    setAction("reject");
  };
  const close = () => {
    if (busy) return;
    setAction(null);
    setTarget(null);
  };

  const confirm = async () => {
    if (!target || !action) return;
    if (action === "reject" && reason.trim().length < 3) {
      toast.error("Motif requis", "Indiquez la raison du rejet (3 caractères min).");
      return;
    }
    setBusy(true);
    try {
      if (action === "approve") {
        await kycService.approve(target.id);
        toast.success("Document approuvé");
      } else {
        await kycService.reject(target.id, reason);
        toast.success("Document rejeté");
      }
      setAction(null);
      setTarget(null);
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const targetLabel = target
    ? KYC_DOCUMENT_LABELS[target.document_type] ?? target.document_type
    : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vérification KYC"
        description="Examinez et statuez sur les documents soumis par les utilisateurs."
        actions={
          <div className="w-48">
            <Select
              options={LEVEL_OPTIONS}
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              aria-label="Filtrer par niveau"
            />
          </div>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => execute()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Aucun document en attente"
          description="Tous les dossiers KYC de ce filtre ont été traités. Bon travail !"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((doc) => (
            <KycDocumentCard
              key={doc.id}
              document={doc}
              canApprove={canApprove}
              canReject={canReject}
              busy={busy && target?.id === doc.id}
              onApprove={openApprove}
              onReject={openReject}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={action === "approve"}
        onOpenChange={(o) => (o ? null : close())}
        title="Approuver ce document ?"
        description={`« ${targetLabel} » sera validé. Le niveau KYC de l'utilisateur sera mis à jour si tous les documents requis sont approuvés.`}
        confirmLabel="Approuver"
        confirmVariant="accent"
        isLoading={busy}
        onConfirm={confirm}
      />

      <ConfirmDialog
        open={action === "reject"}
        onOpenChange={(o) => (o ? null : close())}
        title="Rejeter ce document ?"
        description={`Indiquez à l'utilisateur pourquoi « ${targetLabel} » est refusé.`}
        confirmLabel="Rejeter"
        confirmVariant="danger"
        isLoading={busy}
        onConfirm={confirm}
      >
        <Field label="Motif du rejet" htmlFor="reject-reason" required>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex : la photo de la carte CIP est illisible."
            maxLength={1000}
          />
        </Field>
      </ConfirmDialog>
    </div>
  );
}
