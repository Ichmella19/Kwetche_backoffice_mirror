/**
 * Service KYC : file des documents à vérifier + décisions.
 */

import { kycRepository } from "@/core/data/repositories";
import type {
  KycDocument,
  KycIdentityPendingResponse,
  KycIdentityReview,
  ReviewKycIdentityInput,
} from "@/lib/types";

class KycService {
  listPending(level?: number): Promise<KycDocument[]> {
    return kycRepository.listPending(level);
  }

  approve(documentId: string): Promise<KycDocument> {
    return kycRepository.approve(documentId);
  }

  reject(documentId: string, reason: string): Promise<KycDocument> {
    return kycRepository.reject(documentId, reason.trim());
  }

  listPendingIdentity(
    page?: number,
    perPage?: number,
    status?: string,
  ): Promise<KycIdentityPendingResponse> {
    return kycRepository.listPendingIdentity(page, perPage, status);
  }

  reviewIdentity(
    userId: string,
    input: ReviewKycIdentityInput,
  ): Promise<KycIdentityReview> {
    return kycRepository.reviewIdentity(userId, {
      ...input,
      reason: input.reason?.trim() || undefined,
    });
  }
}

export const kycService = new KycService();
