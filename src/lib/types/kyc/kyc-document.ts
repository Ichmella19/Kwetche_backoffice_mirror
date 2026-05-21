import type { KycDocumentStatus, KycDocumentType } from "@/lib/enums";

export interface KycDocument {
  id: string;
  user_id: string;
  document_type: KycDocumentType | string;
  target_level: number;
  file_url: string;
  status: KycDocumentStatus | string;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  extra: Record<string, unknown> | null;
  submitted_at: string | null;
  updated_at: string | null;
}
