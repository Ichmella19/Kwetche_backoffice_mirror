/**
 * Service KYC : file des documents/dossiers à vérifier + décisions agent.
 */

import { kycRepository } from "@/core/data/repositories";
import type {
  KycDocument,
  KycIdentityPendingResponse,
  KycIdentityReview,
  ReviewKycDocumentInput,
  ReviewKycIdentityInput,
} from "@/lib/types";

class KycService {
  // ── Documents niveaux 2/3 ──────────────────────────
  listPendingDocuments(targetLevel?: number): Promise<KycDocument[]> {
    return kycRepository.listPendingDocuments(targetLevel);
  }

  reviewDocument(
    documentId: string,
    input: ReviewKycDocumentInput,
  ): Promise<KycDocument> {
    return kycRepository.reviewDocument(documentId, {
      ...input,
      reason: input.reason?.trim() || undefined,
    });
  }

  // ── Identité niveau 1 ──────────────────────────────
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
