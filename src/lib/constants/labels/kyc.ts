import { KycDocumentStatus, KycDocumentType } from "@/lib/enums";

export const KYC_STATUS_LABELS: Record<string, string> = {
  [KycDocumentStatus.PENDING]: "En attente",
  [KycDocumentStatus.APPROVED]: "Approuvé",
  [KycDocumentStatus.REJECTED]: "Rejeté",
};

export const KYC_DOCUMENT_LABELS: Record<string, string> = {
  [KycDocumentType.CIP_PHOTO]: "Photo de la carte CIP",
  [KycDocumentType.BIOMETRIC_CARD]: "Carte biométrique",
  [KycDocumentType.PAYSLIP]: "Fiche de paie",
  [KycDocumentType.EMPLOYMENT_CONTRACT]: "Contrat de travail",
  [KycDocumentType.INCOME_PROOF]: "Justificatif de revenus",
  [KycDocumentType.BANK_ACCOUNT_CONSENT]: "Mandat d'accès bancaire",
  [KycDocumentType.BANK_STATEMENT]: "Relevés bancaires",
  [KycDocumentType.PROPERTY_TITLE]: "Titre de propriété / bail",
  [KycDocumentType.TAX_NOTICE]: "Avis d'imposition",
  [KycDocumentType.GUARANTOR_PLEDGE]: "Engagement de garant",
  [KycDocumentType.BUSINESS_REGISTRATION]: "RCCM / patente",
};
