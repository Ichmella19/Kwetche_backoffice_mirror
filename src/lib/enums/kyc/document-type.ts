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
  // Niveau 3 : garanties & banque
  BANK_STATEMENT = "bank_statement",
  BANK_RIB = "bank_rib",
  GUARANTOR_PLEDGE = "guarantor_pledge",
}
