import { httpService } from "@/core/data/http.service";
import type { IKycRepository } from "@/core/domain/repositories";
import type { KycDocument } from "@/lib/types";

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
}

export const kycRepository = new KycRepository();
