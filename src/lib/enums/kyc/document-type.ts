/**
 * Types et statuts des documents KYC.
 * Miroir de `app/commons/enums/kyc/document_type.py`.
 */

export enum KycDocumentType {
  // Niveau 1
  CIP_PHOTO = "cip_photo",
  // Niveau 2
  BIOMETRIC_CARD = "biometric_card",
  PAYSLIP = "payslip",
  EMPLOYMENT_CONTRACT = "employment_contract",
  INCOME_PROOF = "income_proof",
  // Niveau 3
  BANK_ACCOUNT_CONSENT = "bank_account_consent",
  BANK_STATEMENT = "bank_statement",
  PROPERTY_TITLE = "property_title",
  TAX_NOTICE = "tax_notice",
  GUARANTOR_PLEDGE = "guarantor_pledge",
  BUSINESS_REGISTRATION = "business_registration",
}

export enum KycDocumentStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}
