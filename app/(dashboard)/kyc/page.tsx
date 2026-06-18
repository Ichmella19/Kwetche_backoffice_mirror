"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  FileImage,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { ErrorState } from "@/presentation/components/shared/error";
import { ConfirmDialog } from "@/presentation/components/shared/confirm-dialog";
import { Pagination } from "@/presentation/components/shared/pagination";
import { DocumentPreview } from "@/presentation/components/kyc";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Field } from "@/presentation/components/ui/field";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { Textarea } from "@/presentation/components/ui/textarea";
import { useAsync, useRealtime, useToast } from "@/presentation/hooks";
import { useAuth } from "@/presentation/contexts/auth-context";
import { kycService } from "@/presentation/services/kyc";
import { Grant, Validation, validationLabel } from "@/lib/enums";
import { fullName } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type {
  KycIdentityPendingResponse,
  KycIdentityReview,
} from "@/lib/types";

const PER_PAGE = 20;
const STATUS_OPTIONS = [
  { value: "pending", label: "En attente" },
  { value: "approved", label: "Approuvés" },
  { value: "declined", label: "Refusés" },
  { value: "blocked", label: "Bloqués" },
  { value: "expired", label: "Expirés" },
  { value: "all", label: "Tous" },
];

type Action = "approve" | "decline" | "block";
type ReviewTarget = "cip" | "selfie" | "identity";

const ACTION_META: Record<
  Action,
  {
    confirmLabel: string;
    toast: string;
    variant: "accent" | "danger";
    status: Validation;
  }
> = {
  approve: {
    confirmLabel: "Approuver",
    toast: "Décision approuvée",
    variant: "accent",
    status: Validation.APPROVED,
  },
  decline: {
    confirmLabel: "Refuser",
    toast: "Document refusé",
    variant: "danger",
    status: Validation.DECLINED,
  },
  block: {
    confirmLabel: "Bloquer",
    toast: "Document bloqué",
    variant: "danger",
    status: Validation.BLOCKED,
  },
};

const TARGET_LABELS: Record<ReviewTarget, string> = {
  cip: "Carte CIP",
  selfie: "Selfie",
  identity: "Identité complète",
};

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === Validation.APPROVED
      ? "success"
      : status === Validation.DECLINED ||
          status === Validation.BLOCKED ||
          status === Validation.EXPIRED
        ? "danger"
        : "warning";

  return <Badge variant={variant}>{validationLabel(status)}</Badge>;
}

function isPendingIdentityValidation(status: string): boolean {
  return (
    status === Validation.UPLOADED_AND_WAITING_FOR_APPROVAL ||
    status === Validation.REUPLOADED_AND_WAITING_FOR_APPROVAL ||
    status === Validation.APPROVED_AND_REUPLOADED
  );
}

function StatusTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filtrer les dossiers KYC par statut"
      className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-1"
    >
      {STATUS_OPTIONS.map((option) => {
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

export default function KycPage() {
  const toast = useToast();
  const { hasGrant } = useAuth();
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<KycIdentityReview | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget>("identity");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxTontines, setMaxTontines] = useState("");
  const [status, setStatus] = useState("pending");
  const [busy, setBusy] = useState(false);
  // Demande de pièce complémentaire à un utilisateur dont le dossier est
  // en attente : tant qu'il n'a pas uploadé, son dossier reste « en attente ».
  const [requestFor, setRequestFor] = useState<KycIdentityReview | null>(null);
  const [requestLabel, setRequestLabel] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [requestTargetLevel, setRequestTargetLevel] = useState("1");

  const canReview = hasGrant(Grant.KYC_APPROVE);
  const fetchPending = useMemo(
    () => () => kycService.listPendingIdentity(page, PER_PAGE, status),
    [page, status],
  );
  const { data, isLoading, error, execute } =
    useAsync<KycIdentityPendingResponse>(fetchPending, false);

  useEffect(() => {
    execute().catch(() => undefined);
  }, [execute, page, status]);

  // Live : refresh dès qu'un nouveau dossier identité arrive (notification BO).
  useRealtime(
    ["kyc.identity.submitted", "kyc.document.submitted"],
    () => {
      execute().catch(() => undefined);
    },
  );

  const openAction = (
    item: KycIdentityReview,
    next: Action,
    nextTarget: ReviewTarget,
  ) => {
    setTarget(item);
    setAction(next);
    setReviewTarget(nextTarget);
    setReason("");
    setExpiresAt("");
    setMaxTontines("");
  };

  const close = () => {
    if (busy) return;
    setAction(null);
    setTarget(null);
  };

  const confirm = async () => {
    if (!target || !action) return;
    if (action !== "approve" && reason.trim().length < 3) {
      toast.error("Motif requis", "Indiquez la raison de la décision.");
      return;
    }
    if (action === "approve" && reviewTarget !== "selfie" && !expiresAt) {
      toast.error("Date requise", "Indiquez la date d'expiration de la carte.");
      return;
    }

    setBusy(true);
    try {
      const meta = ACTION_META[action];
      const applyCip = reviewTarget === "cip" || reviewTarget === "identity";
      const applySelfie =
        reviewTarget === "selfie" || reviewTarget === "identity";
      await kycService.reviewIdentity(target.user_id, {
        cip_validation: applyCip ? meta.status : undefined,
        selfie_validation: applySelfie ? meta.status : undefined,
        identity_expires_at:
          action === "approve" && applyCip ? expiresAt : undefined,
        reason,
        max_tontines:
          action === "approve" && maxTontines.trim().length > 0
            ? Number(maxTontines)
            : undefined,
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

  // ── Demande de pièce complémentaire ─────────────────
  const submitRequest = async () => {
    if (!requestFor) return;
    if (requestLabel.trim().length < 3) {
      toast.error("Libellé requis", "Décrivez la pièce demandée (ex. CIP recto plus lisible).");
      return;
    }
    const level = Number(requestTargetLevel);
    if (!Number.isFinite(level) || level < 1 || level > 3) {
      toast.error("Niveau invalide", "Niveau cible 1, 2 ou 3.");
      return;
    }
    setBusy(true);
    try {
      await kycService.createRequest({
        user_id: requestFor.user_id,
        target_level: level,
        label: requestLabel,
        note: requestNote || undefined,
      });
      toast.success(
        "Demande envoyée",
        "L'utilisateur sera notifié et le dossier reste en attente.",
      );
      setRequestFor(null);
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PER_PAGE));
  const meta = action ? ACTION_META[action] : null;
  const dialogTitle =
    action && reviewTarget
      ? `${ACTION_META[action].confirmLabel} - ${TARGET_LABELS[reviewTarget]}`
      : "";
  const dialogDescription =
    reviewTarget === "identity"
      ? "La décision sera appliquée à la CIP et au selfie."
      : `La décision sera appliquée uniquement à ${TARGET_LABELS[
          reviewTarget
        ].toLowerCase()}.`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revue identité KYC"
        description="Contrôlez les dossiers niveau 1 : NPI, photo CIP et selfie."
      />

      <StatusTabs
        value={status}
        onChange={(nextStatus) => {
          setPage(1);
          setStatus(nextStatus);
        }}
      />

      {isLoading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => execute()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Aucun dossier identité"
          description="Aucun dossier ne correspond au statut sélectionné."
        />
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            {data.items.map((item) => {
              const cipPending = isPendingIdentityValidation(item.cip_validation);
              const selfiePending = isPendingIdentityValidation(item.selfie_validation);
              const identityFullyApproved =
                item.cip_validation === Validation.APPROVED &&
                item.selfie_validation === Validation.APPROVED;

              return (
                <Card key={item.user_id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{fullName(item.first_name, item.last_name)}</CardTitle>
                        <p className="mt-1 text-sm text-muted">
                          {item.country_code}
                          {item.phone} · NPI {item.npi_number ?? "non renseigné"}
                        </p>
                      </div>
                      <Badge variant="info">Niveau {item.kyc_level}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(item.identity_expires_at ||
                      item.identity_review_reason) && (
                      <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted">
                        {item.identity_expires_at && (
                          <p>
                            Expire le{" "}
                            {new Date(
                              item.identity_expires_at,
                            ).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                        {item.identity_review_reason && (
                          <p>Motif : {item.identity_review_reason}</p>
                        )}
                      </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">Carte CIP</p>
                          <StatusBadge status={item.cip_validation} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <DocumentPreview
                            fileUrl={item.cip_photo}
                            label="CIP — recto"
                          />
                          <DocumentPreview
                            fileUrl={item.cip_back_photo}
                            label="CIP — verso"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-end gap-2">
                          {cipPending ? (
                            <Button
                              variant="accent"
                              size="sm"
                              className="w-full sm:w-auto"
                              disabled={!canReview}
                              onClick={() => openAction(item, "approve", "cip")}
                            >
                              <CheckCircle2 className="size-4" />
                              Approuver
                            </Button>
                          ) : null}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            disabled={!canReview}
                            onClick={() => openAction(item, "decline", "cip")}
                          >
                            <XCircle className="size-4" />
                            Refuser
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">Selfie</p>
                          <StatusBadge status={item.selfie_validation} />
                        </div>
                        <DocumentPreview
                          fileUrl={item.selfie_photo}
                          label="Selfie"
                        />
                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-end gap-2">
                          {selfiePending ? (
                            <Button
                              variant="accent"
                              size="sm"
                              className="w-full sm:w-auto"
                              disabled={!canReview}
                              onClick={() => openAction(item, "approve", "selfie")}
                            >
                              <CheckCircle2 className="size-4" />
                              Approuver
                            </Button>
                          ) : null}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            disabled={!canReview}
                            onClick={() => openAction(item, "decline", "selfie")}
                          >
                            <XCircle className="size-4" />
                            Refuser
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={!canReview}
                      onClick={() => {
                        setRequestFor(item);
                        setRequestLabel("");
                        setRequestNote("");
                        setRequestTargetLevel("1");
                      }}
                    >
                      <FileImage className="size-4" />
                      Demander une photo
                    </Button>
                    {!identityFullyApproved ? (
                      <Button
                        variant="accent"
                        size="sm"
                        className="w-full sm:w-auto"
                        disabled={!canReview}
                        onClick={() => openAction(item, "approve", "identity")}
                      >
                        <CheckCircle2 className="size-4" />
                        Tout approuver
                      </Button>
                    ) : null}
                    <Button
                      variant="danger"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={!canReview}
                      onClick={() => openAction(item, "block", "identity")}
                    >
                      <Ban className="size-4" />
                      Tout bloquer
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <ConfirmDialog
        open={Boolean(meta)}
        onOpenChange={(o) => (o ? null : close())}
        title={dialogTitle}
        description={dialogDescription}
        confirmLabel={meta?.confirmLabel ?? "Confirmer"}
        confirmVariant={meta?.variant ?? "accent"}
        isLoading={busy}
        onConfirm={confirm}
      >
        {action === "approve" && reviewTarget !== "selfie" && (
          <Field
            label="Date d'expiration"
            htmlFor="identity-expires-at"
            required
          >
            <Input
              id="identity-expires-at"
              type="date"
              value={expiresAt}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </Field>
        )}
        {action === "approve" && (
          <Field
            label="Tontines simultanées max (optionnel)"
            htmlFor="identity-max-tontines"
          >
            <Input
              id="identity-max-tontines"
              type="number"
              min={0}
              max={50}
              value={maxTontines}
              placeholder="Laisser vide pour conserver la valeur actuelle"
              onChange={(e) => setMaxTontines(e.target.value)}
            />
          </Field>
        )}
        {action !== "approve" && (
          <Field label="Motif" htmlFor="identity-review-reason" required>
            <Textarea
              id="identity-review-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex : selfie illisible ou document incohérent."
              maxLength={1000}
            />
          </Field>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={!!requestFor}
        onOpenChange={(open) => !open && setRequestFor(null)}
        title="Demander une pièce complémentaire"
        description={
          requestFor
            ? `Une notification sera envoyée à l'utilisateur. Tant qu'il n'a pas fourni la pièce, son dossier reste en attente.`
            : ""
        }
        confirmLabel="Envoyer la demande"
        confirmVariant="accent"
        isLoading={busy}
        onConfirm={submitRequest}
      >
        <Field label="Libellé de la pièce demandée" required>
          <Input
            value={requestLabel}
            onChange={(e) => setRequestLabel(e.target.value)}
            placeholder="Ex : CIP recto plus lisible / Selfie en bonne lumière"
            maxLength={200}
          />
        </Field>
        <Field label="Niveau cible" htmlFor="req-target-level">
          <Select
            id="req-target-level"
            value={requestTargetLevel}
            options={[
              { value: "1", label: "Niveau 1 — Identité" },
              { value: "2", label: "Niveau 2 — Revenus" },
              { value: "3", label: "Niveau 3 — Banque / garant / Mobile Money" },
            ]}
            onChange={(e) => setRequestTargetLevel(e.target.value)}
          />
        </Field>
        <Field label="Note (optionnelle, vue par l'utilisateur)">
          <Textarea
            value={requestNote}
            onChange={(e) => setRequestNote(e.target.value)}
            placeholder="Ex : votre CIP est floue, merci d'envoyer une photo plus nette en lumière naturelle."
            maxLength={1000}
          />
        </Field>
      </ConfirmDialog>
    </div>
  );
}
