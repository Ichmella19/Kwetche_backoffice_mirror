"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Briefcase,
  Building2,
  History,
  ShieldCheck,
  ShieldQuestion,
  UserSquare2,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { ErrorState } from "@/presentation/components/shared/error";
import { ConfirmDialog } from "@/presentation/components/shared/confirm-dialog";
import {
  KycDocumentCard,
  type KycDocumentAction,
} from "@/presentation/components/kyc/kyc-document-card";
import { Avatar, AvatarFallback } from "@/presentation/components/ui/avatar";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Field } from "@/presentation/components/ui/field";
import { Input } from "@/presentation/components/ui/input";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { Textarea } from "@/presentation/components/ui/textarea";
import { useAsync, useToast } from "@/presentation/hooks";
import { kycService } from "@/presentation/services/kyc";
import { ROUTES } from "@/lib/constants";
import {
  EMPLOYMENT_STATUS_LABELS,
  GUARANTEE_TYPE_LABELS,
  KycDocumentType,
  Validation,
  VALIDATION_LABELS,
  guarantorRelationshipLabel,
  isBusinessOwner,
  kycActionLabel,
  kycActionTone,
  levelForDocumentType,
  mobileMoneyProviderLabel,
} from "@/lib/enums";
import { getInitials } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type {
  KycDocument,
  KycDossierDetail,
  KycGuarantee,
  KycHistoryEntry,
  KycProfileN2,
  KycProfileN3,
} from "@/lib/types";

const ACTION_META: Record<
  KycDocumentAction,
  {
    label: string;
    toast: string;
    variant: "accent" | "danger";
    validation: Validation;
    needsReason: boolean;
  }
> = {
  approve: {
    label: "Approuver",
    toast: "Document approuvé",
    variant: "accent",
    validation: Validation.APPROVED,
    needsReason: false,
  },
  decline: {
    label: "Refuser",
    toast: "Document refusé",
    variant: "danger",
    validation: Validation.DECLINED,
    needsReason: true,
  },
  block: {
    label: "Bloquer",
    toast: "Document bloqué",
    variant: "danger",
    validation: Validation.BLOCKED,
    needsReason: true,
  },
};

type GuaranteeAction = "approve" | "decline" | "block";

const GUARANTEE_META: Record<
  GuaranteeAction,
  {
    label: string;
    toast: string;
    variant: "accent" | "danger";
    validation: Validation;
    needsReason: boolean;
  }
> = {
  approve: {
    label: "Approuver",
    toast: "Garantie approuvée",
    variant: "accent",
    validation: Validation.APPROVED,
    needsReason: false,
  },
  decline: {
    label: "Refuser",
    toast: "Garantie refusée",
    variant: "danger",
    validation: Validation.DECLINED,
    needsReason: true,
  },
  block: {
    label: "Bloquer",
    toast: "Garantie bloquée",
    variant: "danger",
    validation: Validation.BLOCKED,
    needsReason: true,
  },
};

interface DossierReviewProps {
  userId: string;
  level: 2 | 3;
}

export function DossierReview({ userId, level }: DossierReviewProps) {
  const router = useRouter();
  const toast = useToast();
  const [loadingNext, setLoadingNext] = useState(false);

  const fetchDetail = useCallback(
    () => kycService.getDossier(userId),
    [userId],
  );

  const { data, isLoading, error, execute } =
    useAsync<KycDossierDetail>(fetchDetail);

  const backUrl = level === 2 ? ROUTES.KYC_N2 : ROUTES.KYC_N3;
  const title =
    level === 2 ? "Revue KYC niveau 2" : "Revue KYC niveau 3";

  // File de revue enchaînée : passe au prochain dossier en attente du niveau.
  async function goNext() {
    setLoadingNext(true);
    try {
      const res = await kycService.listDossiers(level, {
        status: "pending",
        perPage: 50,
      });
      const next = res.items.find((d) => d.user.id !== userId);
      if (next) {
        router.push(`${backUrl}/${next.user.id}`);
      } else {
        toast.success("File vide", "Plus aucun dossier en attente.");
        router.push(backUrl);
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoadingNext(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Champs déclarés et justificatifs côte à côte. Décision par pièce."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href={backUrl}>
                <ArrowLeft className="size-4" />
                Retour à la liste
              </Link>
            </Button>
            <Button onClick={goNext} isLoading={loadingNext}>
              Dossier suivant
              <ArrowRight className="size-4" />
            </Button>
          </div>
        }
      />

      {error ? (
        <ErrorState
          title="Dossier introuvable"
          message={getErrorMessage(error)}
          onRetry={execute}
        />
      ) : isLoading || !data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <DossierBody detail={data} level={level} onReviewed={execute} />
      )}
    </div>
  );
}

function DossierBody({
  detail,
  level,
  onReviewed,
}: {
  detail: KycDossierDetail;
  level: 2 | 3;
  onReviewed: () => Promise<unknown> | void;
}) {
  const { user, profile_n2, profile_n3, documents, guarantees } = detail;
  const documentsForLevel = useMemo(
    () => documents.filter((d) => levelForDocumentType(d.document_type) === level),
    [documents, level],
  );

  const pendingDocs = documentsForLevel.filter((d) =>
    isPendingValidation(d.validation),
  ).length;
  const pendingGuarantees =
    level === 3
      ? guarantees.filter((g) => isPendingValidation(g.validation)).length
      : 0;

  return (
    <div className="space-y-6">
      <DossierStatusBanner
        level={level}
        pendingDocs={pendingDocs}
        pendingGuarantees={pendingGuarantees}
        structuredOk={
          level === 2 ? !!profile_n2?.has_income_info : !!profile_n3?.has_bank_info
        }
      />
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <DossierSidebar
          user={user}
          profileN2={profile_n2}
          profileN3={profile_n3}
          guarantees={guarantees}
        />
        <div className="space-y-6">
          {level === 2 ? (
            <ProfileN2Card profile={profile_n2} />
          ) : (
            <ProfileN3Card profile={profile_n3} />
          )}

          <DocumentsBlock
            documents={documentsForLevel}
            onReviewed={onReviewed}
          />

          {level === 3 ? (
            <GuaranteesBlock guarantees={guarantees} onReviewed={onReviewed} />
          ) : null}

          <HistoryBlock history={detail.history} />
        </div>
      </div>
    </div>
  );
}

function HistoryBlock({ history }: { history: KycHistoryEntry[] }) {
  if (!history || history.length === 0) return null;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <History className="size-4" />
        <CardTitle className="text-base">
          Historique des décisions ({history.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <ol className="relative space-y-4 border-l border-border pl-5">
          {history.map((h) => (
            <li key={h.id} className="relative">
              <span className="absolute -left-[1.42rem] top-1 size-2.5 rounded-full bg-border ring-4 ring-background" />
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={kycActionTone(h.action)}>
                  {kycActionLabel(h.action)}
                </Badge>
                <span className="text-sm font-medium">
                  {kycDocumentLabelFor(h.document_type)}
                </span>
                <span className="text-xs text-muted">
                  · {h.actor_role === "agent" ? "Agent" : "Utilisateur"}
                </span>
                <span className="ml-auto text-xs text-muted">
                  {h.created_at
                    ? new Date(h.created_at).toLocaleString("fr-FR")
                    : "—"}
                </span>
              </div>
              {h.reason ? (
                <p className="mt-1 text-xs text-muted">Motif : {h.reason}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

/** Vrai si une validation est en attente de décision agent. */
function isPendingValidation(v: string): boolean {
  return (
    v === Validation.UPLOADED_AND_WAITING_FOR_APPROVAL ||
    v === Validation.REUPLOADED_AND_WAITING_FOR_APPROVAL ||
    v === Validation.APPROVED_AND_REUPLOADED
  );
}

function DossierStatusBanner({
  level,
  pendingDocs,
  pendingGuarantees,
  structuredOk,
}: {
  level: 2 | 3;
  pendingDocs: number;
  pendingGuarantees: number;
  structuredOk: boolean;
}) {
  const totalPending = pendingDocs + pendingGuarantees;
  const allClear = totalPending === 0 && structuredOk;

  return (
    <Card
      className={
        allClear
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-amber-500/30 bg-amber-500/5"
      }
    >
      <CardContent className="flex flex-wrap items-center gap-4 p-4">
        <div
          className={`flex size-10 items-center justify-center rounded-full ${
            allClear
              ? "bg-emerald-500/15 text-emerald-600"
              : "bg-amber-500/15 text-amber-600"
          }`}
        >
          {allClear ? (
            <ShieldCheck className="size-5" />
          ) : (
            <ShieldQuestion className="size-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">
            {allClear
              ? "Rien en attente sur ce niveau"
              : "Éléments à examiner"}
          </p>
          <p className="text-sm text-muted">
            {allClear
              ? "Tous les justificatifs sont traités et les données requises sont renseignées."
              : "Traite les pièces ci-dessous pour décider de l'octroi du niveau."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={pendingDocs > 0 ? "warning" : "neutral"}>
            {pendingDocs} justificatif{pendingDocs > 1 ? "s" : ""} en attente
          </Badge>
          {level === 3 ? (
            <Badge variant={pendingGuarantees > 0 ? "warning" : "neutral"}>
              {pendingGuarantees} garantie{pendingGuarantees > 1 ? "s" : ""} en
              attente
            </Badge>
          ) : null}
          <Badge variant={structuredOk ? "accent" : "warning"}>
            {level === 2 ? "Revenus" : "Banque"}{" "}
            {structuredOk ? "renseignés" : "manquants"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function DossierSidebar({
  user,
  profileN2,
  profileN3,
  guarantees,
}: {
  user: KycDossierDetail["user"];
  profileN2: KycProfileN2 | null;
  profileN3: KycProfileN3 | null;
  guarantees: KycGuarantee[];
}) {
  const pendingGuarantees = guarantees.filter(
    (g) =>
      g.validation === Validation.UPLOADED_AND_WAITING_FOR_APPROVAL ||
      g.validation === Validation.REUPLOADED_AND_WAITING_FOR_APPROVAL,
  ).length;
  return (
    <aside className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback>
                {getInitials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold leading-tight">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-muted">
                {user.country_code} {user.phone}
              </p>
              {user.email ? (
                <p className="text-xs text-muted">{user.email}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="neutral">N{user.kyc_level} actuel</Badge>
            {typeof user.max_tontines === "number" ? (
              <Badge variant="outline">
                Max tontines : {user.max_tontines}
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Synthèse profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 px-5 pb-5 text-sm">
          <SidebarRow
            label="Revenus / activité"
            ok={!!profileN2?.has_income_info}
          />
          <SidebarRow
            label="Activité formelle (IFU/RCCM)"
            ok={!!profileN2?.has_business_info}
          />
          <SidebarRow label="Banque" ok={!!profileN3?.has_bank_info} />
          <SidebarRow label="Garant" ok={!!profileN3?.has_guarantor_info} />
          <SidebarRow
            label={`Garanties à revoir (${pendingGuarantees})`}
            ok={pendingGuarantees === 0}
          />
        </CardContent>
      </Card>
    </aside>
  );
}

function SidebarRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <Badge variant={ok ? "accent" : "warning"}>
        {ok ? "Renseigné" : "Manquant"}
      </Badge>
    </div>
  );
}

function ProfileN2Card({ profile }: { profile: KycProfileN2 | null }) {
  // Affiche la section entrepreneur si déclaré OU si des données business
  // existent (robustesse face à une incohérence de statut).
  const showBusiness =
    isBusinessOwner(profile?.employment_status) || !!profile?.has_business_info;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Briefcase className="size-4" />
        <CardTitle className="text-base">Revenus & activité</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {!profile ? (
          <p className="text-sm text-muted">Aucune donnée saisie.</p>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <KV
              label="Statut professionnel"
              value={
                profile.employment_status
                  ? EMPLOYMENT_STATUS_LABELS[profile.employment_status] ??
                    profile.employment_status
                  : null
              }
            />
            <KV
              label="Revenu mensuel déclaré"
              value={
                profile.declared_monthly_income != null
                  ? `${profile.declared_monthly_income.toLocaleString()} ${profile.income_currency ?? "XOF"}`
                  : null
              }
            />
            <KV label="Source des revenus" value={profile.income_source} />
            <KV label="Employeur" value={profile.employer_name} />
            <KV label="Adresse employeur" value={profile.employer_address} />
            <KV label="Téléphone employeur" value={profile.employer_phone} />
            <KV
              label="Ancienneté (années)"
              value={profile.years_at_current_job}
            />
            <KV
              label="Charges mensuelles"
              value={
                profile.monthly_expenses != null
                  ? `${profile.monthly_expenses.toLocaleString()} ${profile.income_currency ?? "XOF"}`
                  : null
              }
            />
            <KV
              label="Personnes à charge"
              value={profile.dependents_count}
            />
          </dl>
        )}

        {showBusiness ? (
          <div className="mt-6 border-t pt-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Building2 className="size-4" />
              Activité formelle (entrepreneur)
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <KV label="Raison sociale" value={profile?.business_name} />
              <KV label="IFU" value={profile?.business_ifu} />
              <KV label="N° RCCM" value={profile?.business_rccm} />
              <KV label="Secteur" value={profile?.business_sector} />
              <KV
                label="Régime fiscal"
                value={profile?.business_tax_regime}
              />
              <KV
                label="Date de création"
                value={profile?.business_creation_date}
              />
              <KV label="Adresse" value={profile?.business_address} />
              <KV
                label="Employés"
                value={profile?.business_employees_count}
              />
            </dl>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ProfileN3Card({ profile }: { profile: KycProfileN3 | null }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Wallet className="size-4" />
        <CardTitle className="text-base">Banque & garant</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {!profile ? (
          <p className="text-sm text-muted">Aucune donnée saisie.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Banknote className="size-4" /> Banque
              </div>
              <dl className="grid gap-3">
                <KV label="Banque" value={profile.bank_name} />
                <KV
                  label="Titulaire du compte"
                  value={profile.bank_account_holder}
                />
                <KV label="RIB / IBAN" value={profile.bank_rib} />
              </dl>

              <div className="mt-5 mb-3 flex items-center gap-2 text-sm font-semibold">
                Mobile Money
              </div>
              <dl className="grid gap-3">
                <KV
                  label="Opérateur"
                  value={mobileMoneyProviderLabel(profile.mobile_money_provider)}
                />
                <KV
                  label="Numéro"
                  value={profile.mobile_money_number}
                />
              </dl>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <UserSquare2 className="size-4" /> Garant
              </div>
              <dl className="grid gap-3">
                <KV
                  label="Nom complet"
                  value={profile.guarantor_full_name}
                />
                <KV label="Téléphone" value={profile.guarantor_phone} />
                <KV
                  label="Lien"
                  value={guarantorRelationshipLabel(profile.guarantor_relationship)}
                />
                <KV label="Adresse" value={profile.guarantor_address} />
              </dl>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KV({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">
        {value === null || value === undefined || value === "" ? (
          <span className="text-muted">—</span>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function DocumentsBlock({
  documents,
  onReviewed,
}: {
  documents: KycDocument[];
  onReviewed: () => Promise<unknown> | void;
}) {
  const toast = useToast();
  const [target, setTarget] = useState<{
    doc: KycDocument;
    action: KycDocumentAction;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [documentReference, setDocumentReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    setTarget(null);
    setReason("");
    setExpiresAt("");
    setDocumentReference("");
  };

  async function onConfirm() {
    if (!target) return;
    const meta = ACTION_META[target.action];
    if (meta.needsReason && !reason.trim()) {
      toast.error("Motif obligatoire pour cette décision.");
      return;
    }
    const isApprove = target.action === "approve";
    setSubmitting(true);
    try {
      await kycService.reviewDocument(target.doc.id, {
        validation: meta.validation,
        reason: reason.trim() || undefined,
        expires_at: isApprove && expiresAt ? expiresAt : undefined,
        document_reference:
          isApprove && documentReference.trim()
            ? documentReference.trim()
            : undefined,
      });
      toast.success(meta.toast);
      await onReviewed();
      close();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <ShieldCheck className="size-4" />
        <CardTitle className="text-base">
          Justificatifs ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-5 pb-5">
        {documents.length === 0 ? (
          <p className="text-sm text-muted">
            Aucun justificatif n&apos;a encore été soumis pour ce niveau.
          </p>
        ) : (
          documents.map((doc) => (
            <KycDocumentCard
              key={doc.id}
              document={doc}
              canReview
              onReview={(d, action) => setTarget({ doc: d, action })}
            />
          ))
        )}

        {target ? (
          <ConfirmDialog
            open
            onOpenChange={(open) => !open && close()}
            title={`${ACTION_META[target.action].label} le justificatif`}
            description={kycDocumentLabelFor(target.doc.document_type)}
            confirmLabel={ACTION_META[target.action].label}
            confirmVariant={ACTION_META[target.action].variant}
            onConfirm={onConfirm}
            isLoading={submitting}
          >
            <Field
              htmlFor="doc-reason"
              label={
                ACTION_META[target.action].needsReason
                  ? "Motif (obligatoire)"
                  : "Motif (optionnel)"
              }
            >
              <Textarea
                id="doc-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Indiquez le motif à transmettre à l'utilisateur…"
              />
            </Field>

            {target.action === "approve" ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field
                  htmlFor="doc-expires"
                  label="Valide jusqu'au (optionnel)"
                >
                  <Input
                    id="doc-expires"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </Field>
                <Field
                  htmlFor="doc-reference"
                  label="N° de référence (optionnel)"
                >
                  <Input
                    id="doc-reference"
                    value={documentReference}
                    onChange={(e) => setDocumentReference(e.target.value)}
                    placeholder="RCCM / IFU / n° relevé…"
                  />
                </Field>
              </div>
            ) : null}
          </ConfirmDialog>
        ) : null}
      </CardContent>
    </Card>
  );
}

function kycDocumentLabelFor(type: string): string {
  switch (type) {
    case KycDocumentType.INCOME_PROOF:
      return "Justificatif de revenus";
    case KycDocumentType.EMPLOYMENT_PROOF:
      return "Attestation d'emploi";
    case KycDocumentType.BUSINESS_REGISTRATION:
      return "Extrait RCCM";
    case KycDocumentType.TAX_CERTIFICATE:
      return "Attestation IFU";
    case KycDocumentType.BANK_STATEMENT:
      return "Relevé bancaire";
    case KycDocumentType.BANK_RIB:
      return "RIB / IBAN";
    case KycDocumentType.GUARANTOR_PLEDGE:
      return "Engagement de garant";
    case KycDocumentType.GUARANTEE_DOCUMENT:
      return "Document de garantie";
    default:
      return type;
  }
}

function GuaranteesBlock({
  guarantees,
  onReviewed,
}: {
  guarantees: KycGuarantee[];
  onReviewed: () => Promise<unknown> | void;
}) {
  const toast = useToast();
  const [target, setTarget] = useState<{
    guarantee: KycGuarantee;
    action: GuaranteeAction;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    setTarget(null);
    setReason("");
  };

  async function onConfirm() {
    if (!target) return;
    const meta = GUARANTEE_META[target.action];
    if (meta.needsReason && !reason.trim()) {
      toast.error("Motif obligatoire pour cette décision.");
      return;
    }
    setSubmitting(true);
    try {
      await kycService.reviewGuarantee(target.guarantee.id, {
        validation: meta.validation,
        reason: reason.trim() || undefined,
      });
      toast.success(meta.toast);
      await onReviewed();
      close();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <ShieldQuestion className="size-4" />
        <CardTitle className="text-base">
          Garanties déclarées ({guarantees.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-5 pb-5">
        {guarantees.length === 0 ? (
          <p className="text-sm text-muted">
            L&apos;utilisateur n&apos;a déclaré aucune garantie.
          </p>
        ) : (
          guarantees.map((g) => (
            <GuaranteeCard
              key={g.id}
              guarantee={g}
              onAct={(action) => setTarget({ guarantee: g, action })}
            />
          ))
        )}

        {target ? (
          <ConfirmDialog
            open
            onOpenChange={(open) => !open && close()}
            title={`${GUARANTEE_META[target.action].label} la garantie`}
            description={
              GUARANTEE_TYPE_LABELS[target.guarantee.guarantee_type] ??
              target.guarantee.guarantee_type_label
            }
            confirmLabel={GUARANTEE_META[target.action].label}
            confirmVariant={GUARANTEE_META[target.action].variant}
            onConfirm={onConfirm}
            isLoading={submitting}
          >
            <Field
              htmlFor="guarantee-reason"
              label={
                GUARANTEE_META[target.action].needsReason
                  ? "Motif (obligatoire)"
                  : "Motif (optionnel)"
              }
            >
              <Textarea
                id="guarantee-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
          </ConfirmDialog>
        ) : null}
      </CardContent>
    </Card>
  );
}

function GuaranteeCard({
  guarantee,
  onAct,
}: {
  guarantee: KycGuarantee;
  onAct: (action: GuaranteeAction) => void;
}) {
  const typeLabel =
    GUARANTEE_TYPE_LABELS[guarantee.guarantee_type] ??
    guarantee.guarantee_type_label;
  const statusLabel = VALIDATION_LABELS[guarantee.validation] ?? guarantee.validation;
  const statusVariant: "accent" | "warning" | "danger" | "neutral" =
    guarantee.validation === Validation.APPROVED
      ? "accent"
      : guarantee.validation === Validation.DECLINED ||
          guarantee.validation === Validation.BLOCKED ||
          guarantee.validation === Validation.EXPIRED
        ? "danger"
        : "warning";
  const isPending =
    guarantee.validation === Validation.UPLOADED_AND_WAITING_FOR_APPROVAL ||
    guarantee.validation === Validation.REUPLOADED_AND_WAITING_FOR_APPROVAL ||
    guarantee.validation === Validation.APPROVED_AND_REUPLOADED;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{typeLabel}</p>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          {guarantee.description ? (
            <p className="mt-1 text-sm text-muted">{guarantee.description}</p>
          ) : null}
        </div>
        <Badge variant="outline">
          {guarantee.estimated_value.toLocaleString()} {guarantee.currency}
        </Badge>
      </div>

      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <KV label="Localisation" value={guarantee.location} />
        <KV label="Tiers / nom" value={guarantee.third_party_name} />
        <KV label="Tiers / contact" value={guarantee.third_party_contact} />
        <KV label="Document" value={guarantee.document_filename} />
      </dl>

      {guarantee.review_reason ? (
        <p className="mt-3 rounded bg-muted-soft px-3 py-2 text-xs text-muted">
          <strong>Motif précédent :</strong> {guarantee.review_reason}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        {guarantee.document_url ? (
          <Button asChild size="sm" variant="ghost" className="w-full sm:w-auto">
            <a
              href={guarantee.document_url}
              target="_blank"
              rel="noreferrer"
            >
              Ouvrir le justificatif
            </a>
          </Button>
        ) : null}
        {isPending ? (
          <>
            <Button
              size="sm"
              variant="accent"
              className="w-full sm:w-auto"
              onClick={() => onAct("approve")}
            >
              Approuver
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="w-full sm:w-auto"
              onClick={() => onAct("decline")}
            >
              Refuser
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => onAct("block")}
            >
              Bloquer
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
