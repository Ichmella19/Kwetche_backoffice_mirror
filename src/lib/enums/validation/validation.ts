/**
 * Miroir TypeScript de l'enum Python `Validation` (statut d'un document KYC).
 */

export enum Validation {
  NOT_UPLOADED = "not_uploaded",
  UPLOADED_AND_WAITING_FOR_APPROVAL = "uploaded_and_waiting_for_approval",
  REUPLOADED_AND_WAITING_FOR_APPROVAL = "reuploaded_and_waiting_for_approval",
  APPROVED_AND_REUPLOADED = "approved_and_reuploaded",
  APPROVED = "approved",
  DECLINED = "declined",
  BLOCKED = "blocked",
  EXPIRED = "expired",
  UNKNOWN = "unknown",
}

export const VALIDATION_LABELS: Record<string, string> = {
  [Validation.NOT_UPLOADED]: "Non soumis",
  [Validation.UPLOADED_AND_WAITING_FOR_APPROVAL]: "En cours de vérification",
  [Validation.REUPLOADED_AND_WAITING_FOR_APPROVAL]: "En cours de vérification",
  [Validation.APPROVED_AND_REUPLOADED]: "En cours de vérification",
  [Validation.APPROVED]: "Approuvé",
  [Validation.DECLINED]: "Refusé",
  [Validation.BLOCKED]: "Bloqué",
  [Validation.EXPIRED]: "Expiré",
  [Validation.UNKNOWN]: "Inconnu",
};

export const validationLabel = (status: string | null | undefined): string =>
  VALIDATION_LABELS[status ?? Validation.UNKNOWN] ??
  VALIDATION_LABELS[Validation.UNKNOWN];
