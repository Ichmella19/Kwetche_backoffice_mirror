/**
 * Types de documents KYC niveaux 2/3.
 * Miroir de `app/commons/enums/kyc/document_type.py`.
 *
 * Le statut d'un document est porté par l'enum `Validation` (un seul
 * state-machine pour tout le KYC, identité comprise).
 */

export enum KycDocumentType {
  // Niveau 2 : revenus
  INCOME_PROOF = "income_proof",
  EMPLOYMENT_PROOF = "employment_proof",
  // Niveau 2 — entrepreneur (si EmploymentStatus.ENTREPRENEUR)
  BUSINESS_REGISTRATION = "business_registration",
  TAX_CERTIFICATE = "tax_certificate",
  // Niveau 3 : garanties & banque
  BANK_STATEMENT = "bank_statement",
  BANK_RIB = "bank_rib",
  GUARANTOR_PLEDGE = "guarantor_pledge",
  GUARANTEE_DOCUMENT = "guarantee_document",
}

export const KYC_DOCUMENT_TYPE_LABELS: Record<string, string> = {
  [KycDocumentType.INCOME_PROOF]: "Justificatif de revenus",
  [KycDocumentType.EMPLOYMENT_PROOF]: "Attestation d'emploi",
  [KycDocumentType.BUSINESS_REGISTRATION]: "Extrait RCCM",
  [KycDocumentType.TAX_CERTIFICATE]: "Attestation fiscale / IFU",
  [KycDocumentType.BANK_STATEMENT]: "Relevé bancaire",
  [KycDocumentType.BANK_RIB]: "RIB / IBAN",
  [KycDocumentType.GUARANTOR_PLEDGE]: "Engagement de garant",
  [KycDocumentType.GUARANTEE_DOCUMENT]: "Document de garantie",
};

/** Niveau KYC auquel appartient un type de document (mirror backend). */
export function levelForDocumentType(t: string): 2 | 3 | null {
  if (
    [
      KycDocumentType.INCOME_PROOF,
      KycDocumentType.EMPLOYMENT_PROOF,
      KycDocumentType.BUSINESS_REGISTRATION,
      KycDocumentType.TAX_CERTIFICATE,
    ].includes(t as KycDocumentType)
  ) {
    return 2;
  }
  if (
    [
      KycDocumentType.BANK_STATEMENT,
      KycDocumentType.BANK_RIB,
      KycDocumentType.GUARANTOR_PLEDGE,
      KycDocumentType.GUARANTEE_DOCUMENT,
    ].includes(t as KycDocumentType)
  ) {
    return 3;
  }
  return null;
}
