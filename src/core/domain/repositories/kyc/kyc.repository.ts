import type {
  CreateDocumentRequestInput,
  KycDocument,
  KycDocumentRequest,
  KycDossierDetail,
  KycDossierListResponse,
  KycGuarantee,
  KycIdentityPendingResponse,
  KycIdentityReview,
  ReviewGuaranteeInput,
  ReviewKycDocumentInput,
  ReviewKycIdentityInput,
} from "@/lib/types";

/** Filtres pour la liste `/admin/kyc/levels/{level}/dossiers`. */
export interface ListDossiersParams {
  page?: number;
  perPage?: number;
  search?: string;
  /** Onglet de statut : `pending` (défaut) | `approved` | `declined` |
   *  `blocked` | `expired` | `all`. Aligné sur la revue identité N1. */
  status?: string;
  /** `oldest` (défaut) | `newest`. */
  sort?: "oldest" | "newest";
}

export interface IKycRepository {
  // ── Documents niveaux 2/3 ──────────────────────────
  listPendingDocuments(targetLevel?: number): Promise<KycDocument[]>;
  reviewDocument(
    documentId: string,
    input: ReviewKycDocumentInput,
  ): Promise<KycDocument>;

  // ── Demandes de pieces complementaires ─────────────
  createRequest(input: CreateDocumentRequestInput): Promise<KycDocumentRequest>;
  listRequests(userId: string, status?: string): Promise<KycDocumentRequest[]>;
  cancelRequest(requestId: string): Promise<KycDocumentRequest>;

  // ── Identité niveau 1 ──────────────────────────────
  listPendingIdentity(
    page?: number,
    perPage?: number,
    status?: string,
  ): Promise<KycIdentityPendingResponse>;
  reviewIdentity(
    userId: string,
    input: ReviewKycIdentityInput,
  ): Promise<KycIdentityReview>;

  // ── Dossiers N2 / N3 (champs + docs + garanties) ───
  listDossiers(
    level: 2 | 3,
    params?: ListDossiersParams,
  ): Promise<KycDossierListResponse>;
  getDossier(userId: string): Promise<KycDossierDetail>;
  reviewGuarantee(
    guaranteeId: string,
    input: ReviewGuaranteeInput,
  ): Promise<KycGuarantee>;
}
