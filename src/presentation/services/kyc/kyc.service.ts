/**
 * Service KYC : file des documents/dossiers à vérifier + décisions agent.
 */

import { kycRepository } from "@/core/data/repositories";
import type {
  CreateDocumentRequestInput,
  KycDocument,
  KycDocumentRequest,
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

  // ── Demandes de pieces complementaires ─────────────
  createRequest(
    input: CreateDocumentRequestInput,
  ): Promise<KycDocumentRequest> {
    return kycRepository.createRequest({
      ...input,
      label: input.label.trim(),
      note: input.note?.trim() || undefined,
    });
  }

  listRequests(userId: string, status?: string): Promise<KycDocumentRequest[]> {
    return kycRepository.listRequests(userId, status);
  }

  cancelRequest(requestId: string): Promise<KycDocumentRequest> {
    return kycRepository.cancelRequest(requestId);
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
