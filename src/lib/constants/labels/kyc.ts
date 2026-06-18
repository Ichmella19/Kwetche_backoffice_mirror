import { KycDocumentType } from "@/lib/enums";

export const KYC_DOCUMENT_LABELS: Record<string, string> = {
  [KycDocumentType.INCOME_PROOF]: "Justificatif de revenu",
  [KycDocumentType.EMPLOYMENT_PROOF]: "Attestation de travail",
  [KycDocumentType.BANK_STATEMENT]: "Relevé bancaire",
  [KycDocumentType.BANK_RIB]: "RIB / IBAN",
  [KycDocumentType.GUARANTOR_PLEDGE]: "Engagement de garant",
  // Documents identité niveau 1 (colonnes user, affichés ici par cohérence).
  cip_photo: "Photo de la carte CIP",
  selfie: "Selfie",
};

export const kycDocumentLabel = (type: string): string =>
  KYC_DOCUMENT_LABELS[type] ?? type;
