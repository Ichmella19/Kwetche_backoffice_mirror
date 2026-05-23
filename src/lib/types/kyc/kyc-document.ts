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
  extra: Record<string, unknown> | null;
  submitted_at: string | null;
  updated_at: string | null;
}

/** Décision agent sur un document niveau 2/3. */
export interface ReviewKycDocumentInput {
  validation: Validation;
  reason?: string;
}
