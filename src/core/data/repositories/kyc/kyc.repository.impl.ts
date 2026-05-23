import { httpService } from "@/core/data/http.service";
import type { IKycRepository } from "@/core/domain/repositories";
import type {
  KycDocument,
  KycIdentityPendingResponse,
  KycIdentityReview,
  ReviewKycDocumentInput,
  ReviewKycIdentityInput,
} from "@/lib/types";

export class KycRepository implements IKycRepository {
  // ── Documents niveaux 2/3 ──────────────────────────
  listPendingDocuments(targetLevel?: number): Promise<KycDocument[]> {
    return httpService.get<KycDocument[]>("/admin/kyc/documents/pending", {
      query: { target_level: targetLevel },
    });
  }

  reviewDocument(
    documentId: string,
    input: ReviewKycDocumentInput,
  ): Promise<KycDocument> {
    return httpService.post<KycDocument>(
      `/admin/kyc/documents/${documentId}/review`,
      input,
    );
  }

  // ── Identité niveau 1 ──────────────────────────────
  listPendingIdentity(
    page = 1,
    perPage = 20,
    status = "pending",
  ): Promise<KycIdentityPendingResponse> {
    return httpService.get<KycIdentityPendingResponse>(
      "/admin/kyc/identity/pending",
      {
        query: { page, per_page: perPage, status },
      },
    );
  }

  reviewIdentity(
    userId: string,
    input: ReviewKycIdentityInput,
  ): Promise<KycIdentityReview> {
    return httpService.post<KycIdentityReview>(
      `/admin/kyc/identity/${userId}/review`,
      input,
    );
  }
}

export const kycRepository = new KycRepository();
