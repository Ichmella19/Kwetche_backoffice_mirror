/**
 * Recouvrement — miroir de `app/commons/enums/recouvrement/*`.
 */

export enum DebtType {
  TONTINE_CONTRIBUTION = "tontine_contribution",
  FEE = "fee",
  OTHER = "other",
}

export enum DebtStatus {
  OPEN = "open",
  IN_RECOVERY = "in_recovery",
  PARTIALLY_RECOVERED = "partially_recovered",
  RECOVERED = "recovered",
  WRITTEN_OFF = "written_off",
  CANCELLED = "cancelled",
}

export enum RelanceChannel {
  SMS = "sms",
  PUSH = "push",
  EMAIL = "email",
  CALL = "call",
}

export enum RelanceStatus {
  SENT = "sent",
  FAILED = "failed",
  ACKNOWLEDGED = "acknowledged",
}

export enum RecouvrementCaseStatus {
  PENDING_ASSIGNMENT = "pending_assignment",
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  PARTIALLY_RECOVERED = "partially_recovered",
  RECOVERED = "recovered",
  UNCOLLECTIBLE = "uncollectible",
  CLOSED = "closed",
}

export enum RecouvrementStage {
  N1_AUTO_RELANCE = "n1_auto_relance",
  N2_FORMAL_NOTICE = "n2_formal_notice",
  N3_REGISTERED_LETTER = "n3_registered_letter",
  N4_JUDICIAL = "n4_judicial",
}

export const RECOUVREMENT_STAGE_LABELS: Record<string, string> = {
  [RecouvrementStage.N1_AUTO_RELANCE]: "N1 — Relances automatiques",
  [RecouvrementStage.N2_FORMAL_NOTICE]: "N2 — Mise en demeure",
  [RecouvrementStage.N3_REGISTERED_LETTER]: "N3 — Lettre recommandée AR",
  [RecouvrementStage.N4_JUDICIAL]: "N4 — Procédure judiciaire",
};

export const RECOUVREMENT_STAGE_RANK: Record<RecouvrementStage, number> = {
  [RecouvrementStage.N1_AUTO_RELANCE]: 1,
  [RecouvrementStage.N2_FORMAL_NOTICE]: 2,
  [RecouvrementStage.N3_REGISTERED_LETTER]: 3,
  [RecouvrementStage.N4_JUDICIAL]: 4,
};

export function nextRecouvrementStage(
  current: RecouvrementStage,
): RecouvrementStage | null {
  const rank = RECOUVREMENT_STAGE_RANK[current] + 1;
  const found = (Object.entries(RECOUVREMENT_STAGE_RANK) as [
    RecouvrementStage,
    number,
  ][]).find(([, r]) => r === rank);
  return found ? found[0] : null;
}

export enum RecouvrementActionType {
  NOTE = "note",
  CALL = "call",
  PAYMENT_PLAN = "payment_plan",
  PAYMENT_RECEIVED = "payment_received",
  ESCALATE = "escalate",
  RESOLVE = "resolve",
  WRITE_OFF = "write_off",
}

export const DEBT_TYPE_LABELS: Record<string, string> = {
  [DebtType.TONTINE_CONTRIBUTION]: "Cotisation tontine",
  [DebtType.FEE]: "Frais",
  [DebtType.OTHER]: "Autre",
};

export const DEBT_STATUS_LABELS: Record<string, string> = {
  [DebtStatus.OPEN]: "Ouverte",
  [DebtStatus.IN_RECOVERY]: "En recouvrement",
  [DebtStatus.PARTIALLY_RECOVERED]: "Partiellement réglée",
  [DebtStatus.RECOVERED]: "Réglée",
  [DebtStatus.WRITTEN_OFF]: "Passée en perte",
  [DebtStatus.CANCELLED]: "Annulée",
};

export const RELANCE_CHANNEL_LABELS: Record<string, string> = {
  [RelanceChannel.SMS]: "SMS",
  [RelanceChannel.PUSH]: "Notification",
  [RelanceChannel.EMAIL]: "Email",
  [RelanceChannel.CALL]: "Appel",
};

export const RELANCE_STATUS_LABELS: Record<string, string> = {
  [RelanceStatus.SENT]: "Envoyée",
  [RelanceStatus.FAILED]: "Échouée",
  [RelanceStatus.ACKNOWLEDGED]: "Vue",
};

export const RECOUVREMENT_CASE_STATUS_LABELS: Record<string, string> = {
  [RecouvrementCaseStatus.PENDING_ASSIGNMENT]: "À assigner",
  [RecouvrementCaseStatus.ASSIGNED]: "Assigné",
  [RecouvrementCaseStatus.IN_PROGRESS]: "En cours",
  [RecouvrementCaseStatus.PARTIALLY_RECOVERED]: "Partiellement recouvré",
  [RecouvrementCaseStatus.RECOVERED]: "Recouvré",
  [RecouvrementCaseStatus.UNCOLLECTIBLE]: "Irrécouvrable",
  [RecouvrementCaseStatus.CLOSED]: "Clôturé",
};

export const RECOUVREMENT_ACTION_TYPE_LABELS: Record<string, string> = {
  [RecouvrementActionType.NOTE]: "Note",
  [RecouvrementActionType.CALL]: "Appel",
  [RecouvrementActionType.PAYMENT_PLAN]: "Plan de paiement",
  [RecouvrementActionType.PAYMENT_RECEIVED]: "Paiement reçu",
  [RecouvrementActionType.ESCALATE]: "Escalade",
  [RecouvrementActionType.RESOLVE]: "Résolution",
  [RecouvrementActionType.WRITE_OFF]: "Passage en perte",
};
