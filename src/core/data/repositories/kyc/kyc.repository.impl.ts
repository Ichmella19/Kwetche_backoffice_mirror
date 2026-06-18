import { httpService } from "@/core/data/http.service";
import type {
  IKycRepository,
  ListDossiersParams,
} from "@/core/domain/repositories/kyc";
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

  // ── Demandes de pieces complementaires ─────────────
  createRequest(
    input: CreateDocumentRequestInput,
  ): Promise<KycDocumentRequest> {
    return httpService.post<KycDocumentRequest>("/admin/kyc/requests", input);
  }

  listRequests(userId: string, status?: string): Promise<KycDocumentRequest[]> {
    return httpService.get<KycDocumentRequest[]>("/admin/kyc/requests", {
      query: { user_id: userId, status },
    });
  }

  cancelRequest(requestId: string): Promise<KycDocumentRequest> {
    return httpService.post<KycDocumentRequest>(
      `/admin/kyc/requests/${requestId}/cancel`,
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

  // ── Dossiers N2 / N3 ───────────────────────────────
  listDossiers(
    level: 2 | 3,
    params: ListDossiersParams = {},
  ): Promise<KycDossierListResponse> {
    return httpService.get<KycDossierListResponse>(
      `/admin/kyc/levels/${level}/dossiers`,
      {
        query: {
          page: params.page,
          per_page: params.perPage,
          search: params.search,
          status: params.status,
          sort: params.sort,
        },
      },
    );
  }

  getDossier(userId: string): Promise<KycDossierDetail> {
    return httpService.get<KycDossierDetail>(
      `/admin/kyc/dossiers/${userId}`,
    );
  }

  reviewGuarantee(
    guaranteeId: string,
    input: ReviewGuaranteeInput,
  ): Promise<KycGuarantee> {
    return httpService.post<KycGuarantee>(
      `/admin/kyc/guarantees/${guaranteeId}/review`,
      input,
    );
  }
}

export const kycRepository = new KycRepository();
