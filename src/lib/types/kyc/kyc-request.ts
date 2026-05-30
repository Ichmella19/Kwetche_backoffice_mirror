import type { KycRequestStatus, Validation } from "@/lib/enums";

/** Miroir de `KycDocumentRequest.to_dict()` (demande de piece complementaire). */
export interface KycDocumentRequest {
  id: string;
  user_id: string;
  target_level: number;
  label: string;
  note: string | null;
  status: KycRequestStatus | string;
  requested_by: string | null;
  document_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Enrichi par l'overview cote utilisateur (non present sur la liste admin).
  document_validation?: Validation | string;
  document_review_reason?: string | null;
}

export interface CreateDocumentRequestInput {
  user_id: string;
  target_level: number;
  label: string;
  note?: string;
}
