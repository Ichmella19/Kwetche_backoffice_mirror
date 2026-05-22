import { httpService } from "@/core/data/http.service";
import type { IKycRepository } from "@/core/domain/repositories";
import type {
  KycDocument,
  KycIdentityPendingResponse,
  KycIdentityReview,
  ReviewKycIdentityInput,
} from "@/lib/types";

export class KycRepository implements IKycRepository {
  listPending(level?: number): Promise<KycDocument[]> {
    return httpService.get<KycDocument[]>("/admin/kyc/pending", {
      query: { level },
    });
  }

  approve(documentId: string): Promise<KycDocument> {
    return httpService.post<KycDocument>(`/admin/kyc/${documentId}/approve`);
  }

  reject(documentId: string, reason: string): Promise<KycDocument> {
    return httpService.post<KycDocument>(`/admin/kyc/${documentId}/reject`, {
      reason,
    });
  }

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
