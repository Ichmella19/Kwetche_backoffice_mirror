import type { KycDocument, KycHistoryEntry } from "./kyc-document";

/** Mini-payload utilisateur (source unique backend `User.to_mini()`),
 *  joint à la liste / au détail dossier comme partout ailleurs. */
export interface KycDossierUserMini {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  country_code: string | null;
  email: string | null;
  profile_photo: string | null;
  kyc_level: number;
  // Champs additionnels présents uniquement sur le détail dossier.
  cip_validation?: string;
  selfie_validation?: string;
  max_tontines?: number;
}

/** Ligne de la liste `/admin/kyc/levels/{level}/dossiers`.
 *  `user` est imbriqué (même contrat que le détail dossier). */
export interface KycDossierListItem {
  user: KycDossierUserMini;
  pending_docs: number;
  /** Données structurées du niveau renseignées (revenus N2 / banque N3). */
  structured_ready: boolean;
  /** Le membre s'est déclaré entrepreneur (IFU/RCCM attendus). */
  is_entrepreneur: boolean;
  oldest_submission_at: string | null;
}

export interface KycDossierListResponse {
  items: KycDossierListItem[];
  total: number;
  page: number;
  per_page: number;
}

/** Profil structuré KYC niveau 2 (`kyc_profile_n2` : revenus + entrepreneur). */
export interface KycProfileN2 {
  id: string;
  user_id: string;
  // Revenus
  declared_monthly_income: number | null;
  income_currency: string | null;
  income_source: string | null;
  employment_status: string | null;
  employer_name: string | null;
  employer_address: string | null;
  employer_phone: string | null;
  years_at_current_job: number | null;
  monthly_expenses: number | null;
  dependents_count: number | null;
  // Entrepreneur
  business_name: string | null;
  business_ifu: string | null;
  business_rccm: string | null;
  business_sector: string | null;
  business_tax_regime: string | null;
  business_creation_date: string | null;
  business_address: string | null;
  business_employees_count: number | null;
  // Prédicats serveur
  has_income_info: boolean;
  has_business_info: boolean;
  created_at: string | null;
  updated_at: string | null;
}

/** Profil structuré KYC niveau 3 (`kyc_profile_n3` : banque + MM + garant). */
export interface KycProfileN3 {
  id: string;
  user_id: string;
  // Banque
  bank_name: string | null;
  bank_account_holder: string | null;
  bank_rib: string | null;
  // Mobile money
  mobile_money_provider: string | null;
  mobile_money_number: string | null;
  // Garant
  guarantor_full_name: string | null;
  guarantor_phone: string | null;
  guarantor_relationship: string | null;
  guarantor_address: string | null;
  // Prédicats serveur
  has_bank_info: boolean;
  has_guarantor_info: boolean;
  created_at: string | null;
  updated_at: string | null;
}

/** Garantie individuelle (`kyc_guarantees`). */
export interface KycGuarantee {
  id: string;
  user_id: string;
  guarantee_type: string;
  guarantee_type_label: string;
  description: string | null;
  estimated_value: number;
  currency: string;
  document_url: string | null;
  document_filename: string | null;
  location: string | null;
  third_party_name: string | null;
  third_party_contact: string | null;
  validation: string;
  review_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Réponse complète `/admin/kyc/dossiers/{user_id}`.
 *  Un profil par niveau (tables séparées côté backend). */
export interface KycDossierDetail {
  user: KycDossierUserMini;
  profile_n2: KycProfileN2 | null;
  profile_n3: KycProfileN3 | null;
  documents: KycDocument[];
  guarantees: KycGuarantee[];
  history: KycHistoryEntry[];
}

export interface ReviewGuaranteeInput {
  validation: string;
  reason?: string | null;
}
