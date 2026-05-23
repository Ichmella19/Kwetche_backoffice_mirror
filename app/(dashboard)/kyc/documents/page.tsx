"use client";

import { useEffect, useMemo, useState } from "react";
import { FileCheck2 } from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { ErrorState } from "@/presentation/components/shared/error";
import { ConfirmDialog } from "@/presentation/components/shared/confirm-dialog";
import { Field } from "@/presentation/components/ui/field";
import { Textarea } from "@/presentation/components/ui/textarea";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import {
  KycDocumentCard,
  KycTabs,
  type KycDocumentAction,
} from "@/presentation/components/kyc";
import { useAsync, useToast } from "@/presentation/hooks";
import { useAuth } from "@/presentation/contexts/auth-context";
import { kycService } from "@/presentation/services/kyc";
import { Grant, Validation } from "@/lib/enums";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { KycDocument } from "@/lib/types";

const LEVEL_TABS = [
  { value: 0, label: "Tous" },
  { value: 2, label: "Niveau 2" },
  { value: 3, label: "Niveau 3" },
];

const ACTION_META: Record<
  KycDocumentAction,
  {
    confirmLabel: string;
    toast: string;
    variant: "accent" | "danger";
    validation: Validation;
    needsReason: boolean;
  }
> = {
  approve: {
    confirmLabel: "Approuver",
    toast: "Document approuvé",
    variant: "accent",
    validation: Validation.APPROVED,
    needsReason: false,
  },
  decline: {
    confirmLabel: "Refuser",
    toast: "Document refusé",
    variant: "danger",
    validation: Validation.DECLINED,
    needsReason: true,
  },
  block: {
    confirmLabel: "Bloquer",
    toast: "Document bloqué",
    variant: "danger",
    validation: Validation.BLOCKED,
    needsReason: true,
  },
};

function LevelTabs({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filtrer par niveau"
      className="flex w-fit gap-1 rounded-lg border border-border bg-surface p-1"
    >
      {LEVEL_TABS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={[
              "shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted hover:bg-muted-soft hover:text-foreground",
            ].join(" ")}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default function KycDocumentsPage() {
  const toast = useToast();
  const { hasGrant } = useAuth();
  const [level, setLevel] = useState(0);
  const [target, setTarget] = useState<KycDocument | null>(null);
  const [action, setAction] = useState<KycDocumentAction | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const canReview = hasGrant(Grant.KYC_APPROVE);

  const fetchPending = useMemo(
    () => () => kycService.listPendingDocuments(level || undefined),
    [level],
  );
  const { data, isLoading, error, execute } = useAsync<KycDocument[]>(
    fetchPending,
    false,
  );

  useEffect(() => {
    execute().catch(() => undefined);
  }, [execute, level]);

  const openAction = (document: KycDocument, next: KycDocumentAction) => {
    setTarget(document);
    setAction(next);
    setReason("");
  };

  const close = () => {
    if (busy) return;
    setAction(null);
    setTarget(null);
  };

  const confirm = async () => {
    if (!target || !action) return;
    const meta = ACTION_META[action];
    if (meta.needsReason && reason.trim().length < 3) {
      toast.error("Motif requis", "Indiquez la raison de la décision.");
      return;
    }

    setBusy(true);
    try {
      await kycService.reviewDocument(target.id, {
        validation: meta.validation,
        reason: meta.needsReason ? reason : undefined,
      });
      toast.success(meta.toast);
      setAction(null);
      setTarget(null);
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const meta = action ? ACTION_META[action] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revue documents KYC"
        description="Validez les documents niveaux 2 et 3 : revenus, banque, garanties."
      />

      <KycTabs />

      <LevelTabs value={level} onChange={setLevel} />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => execute()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="Aucun document en attente"
          description="Aucun document ne correspond au niveau sélectionné."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((document) => (
            <KycDocumentCard
              key={document.id}
              document={document}
              canReview={canReview}
              busy={busy}
              onReview={openAction}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(meta)}
        onOpenChange={(o) => (o ? null : close())}
        title={meta ? `${meta.confirmLabel} le document` : ""}
        description={
          meta?.needsReason
            ? "Le demandeur sera notifié de la décision et du motif."
            : "Le document sera marqué comme approuvé."
        }
        confirmLabel={meta?.confirmLabel ?? "Confirmer"}
        confirmVariant={meta?.variant ?? "accent"}
        isLoading={busy}
        onConfirm={confirm}
      >
        {meta?.needsReason && (
          <Field label="Motif" htmlFor="doc-review-reason" required>
            <Textarea
              id="doc-review-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex : relevé bancaire illisible ou périmé."
              maxLength={1000}
            />
          </Field>
        )}
      </ConfirmDialog>
    </div>
  );
}
