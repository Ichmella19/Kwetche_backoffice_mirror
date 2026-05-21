/**
 * Service KYC : file des documents à vérifier + décisions.
 */

import { kycRepository } from "@/core/data/repositories";
import type { KycDocument } from "@/lib/types";

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
}

export const kycService = new KycService();
