/**
 * Statut d'une demande de document complementaire (agent -> utilisateur).
 * Miroir de `app/commons/enums/kyc/kyc_request_status.py`.
 */
export enum KycRequestStatus {
  PENDING = "pending",
  FULFILLED = "fulfilled",
  CANCELLED = "cancelled",
}

export const KYC_REQUEST_STATUS_LABELS: Record<string, string> = {
  [KycRequestStatus.PENDING]: "En attente",
  [KycRequestStatus.FULFILLED]: "Fourni",
  [KycRequestStatus.CANCELLED]: "Annulé",
};

export const kycRequestStatusLabel = (status: string): string =>
  KYC_REQUEST_STATUS_LABELS[status] ?? status;
