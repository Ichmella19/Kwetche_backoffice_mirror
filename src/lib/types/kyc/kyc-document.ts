import type { KycDocumentType, Validation } from "@/lib/enums";

/** Miroir de `KycDocument.to_dict()` (table `kyc_documents`, niveaux 2/3). */
export interface KycDocument {
  id: string;
  user_id: string;
  document_type: KycDocumentType | string;
  target_level: number;
  file_url: string;
  validation: Validation | string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_reason: string | null;
  /** Validité saisie à l'approbation (ISO) — déclenche l'expiration auto. */
  expires_at: string | null;
  /** N° de référence de la pièce (RCCM, IFU, n° de relevé…). */
  document_reference: string | null;
  extra: Record<string, unknown> | null;
  submitted_at: string | null;
  updated_at: string | null;
}

/** Décision agent sur un document niveau 2/3. */
export interface ReviewKycDocumentInput {
  validation: Validation;
  reason?: string;
  /** À l'approbation : validité (ISO date) + n° de référence (optionnels). */
  expires_at?: string | null;
  document_reference?: string | null;
}

/** Ligne du journal KYC append-only (`KycDocumentHistory.to_dict()`). */
export interface KycHistoryEntry {
  id: string;
  document_type: string;
  target_level: number;
  action: string;
  validation: string;
  file_url: string | null;
  actor_id: string | null;
  actor_role: string;
  reason: string | null;
  created_at: string | null;
}
