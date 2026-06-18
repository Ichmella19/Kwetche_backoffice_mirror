/**
 * Action journalisée dans l'historique KYC (`kyc_document_history`).
 * Miroir de `app/commons/enums/kyc/kyc_action.py`.
 */

export enum KycAction {
  SUBMITTED = "submitted",
  RESUBMITTED = "resubmitted",
  APPROVED = "approved",
  DECLINED = "declined",
  BLOCKED = "blocked",
  EXPIRED = "expired",
}

export const KYC_ACTION_LABELS: Record<string, string> = {
  [KycAction.SUBMITTED]: "Document soumis",
  [KycAction.RESUBMITTED]: "Document re-soumis",
  [KycAction.APPROVED]: "Approuvé",
  [KycAction.DECLINED]: "Refusé",
  [KycAction.BLOCKED]: "Bloqué",
  [KycAction.EXPIRED]: "Expiré",
};

export const kycActionLabel = (value: string): string =>
  KYC_ACTION_LABELS[value] ?? value;

/** Variante de badge pour une action (vert = approuvé, rouge = négatif…). */
export function kycActionTone(
  value: string,
): "accent" | "danger" | "warning" | "neutral" {
  if (value === KycAction.APPROVED) return "accent";
  if (
    value === KycAction.DECLINED ||
    value === KycAction.BLOCKED ||
    value === KycAction.EXPIRED
  ) {
    return "danger";
  }
  if (value === KycAction.SUBMITTED || value === KycAction.RESUBMITTED) {
    return "warning";
  }
  return "neutral";
}
