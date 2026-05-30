import type { Validation } from "@/lib/enums";

export interface KycIdentityReview {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  country_code: string;
  npi_number: string | null;
  cip_photo: string | null;
  cip_back_photo: string | null;
  cip_validation: Validation | string;
  selfie_photo: string | null;
  selfie_validation: Validation | string;
  identity_expires_at: string | null;
  identity_review_reason: string | null;
  identity_expiry_notified_at: string | null;
  kyc_level: number;
}

export interface KycIdentityPendingResponse {
  items: KycIdentityReview[];
  total: number;
  page: number;
  per_page: number;
  status?: string;
}

export interface ReviewKycIdentityInput {
  cip_validation?: Validation;
  selfie_validation?: Validation;
  identity_expires_at?: string;
  reason?: string;
  /** Limite du nombre de tontines simultanées (fixée par l'admin à la validation KYC). */
  max_tontines?: number;
}
