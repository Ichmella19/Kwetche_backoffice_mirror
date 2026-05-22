import type {
  KycDocument,
  KycIdentityPendingResponse,
  KycIdentityReview,
  ReviewKycIdentityInput,
} from "@/lib/types";

export interface IKycRepository {
  listPending(level?: number): Promise<KycDocument[]>;
  approve(documentId: string): Promise<KycDocument>;
  reject(documentId: string, reason: string): Promise<KycDocument>;
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
