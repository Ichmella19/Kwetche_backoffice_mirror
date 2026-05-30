import type {
  CreateDocumentRequestInput,
  KycDocument,
  KycDocumentRequest,
  KycIdentityPendingResponse,
  KycIdentityReview,
  ReviewKycDocumentInput,
  ReviewKycIdentityInput,
} from "@/lib/types";

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
}
