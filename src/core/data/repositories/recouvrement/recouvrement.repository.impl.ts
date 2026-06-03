import { httpService } from "@/core/data/http.service";
import type { IRecouvrementRepository } from "@/core/domain/repositories/recouvrement";
import type {
  AddRecouvrementActionInput,
  RecouvrementAction,
  RecouvrementCase,
  RecouvrementCaseDetail,
  RecouvrementCaseListResponse,
  ResolveCaseInput,
} from "@/lib/types";

export class RecouvrementRepository implements IRecouvrementRepository {
  listCases({
    page,
    perPage,
    status,
    assignedAgentId,
  }: {
    page: number;
    perPage: number;
    status?: string;
    assignedAgentId?: string;
  }): Promise<RecouvrementCaseListResponse> {
    return httpService.get<RecouvrementCaseListResponse>(
      "/admin/recouvrement/cases",
      {
        query: {
          page,
          per_page: perPage,
          status,
          assigned_agent_id: assignedAgentId,
        },
      },
    );
  }

  getCase(caseId: string): Promise<RecouvrementCaseDetail> {
    return httpService.get<RecouvrementCaseDetail>(
      `/admin/recouvrement/cases/${caseId}`,
    );
  }

  assignSelf(caseId: string): Promise<RecouvrementCase> {
    return httpService.post<RecouvrementCase>(
      `/admin/recouvrement/cases/${caseId}/assign-self`,
    );
  }

  addAction(
    caseId: string,
    input: AddRecouvrementActionInput,
  ): Promise<{ action: RecouvrementAction; case: RecouvrementCase }> {
    return httpService.post<{
      action: RecouvrementAction;
      case: RecouvrementCase;
    }>(`/admin/recouvrement/cases/${caseId}/actions`, input);
  }

  resolve(caseId: string, input: ResolveCaseInput): Promise<RecouvrementCase> {
    return httpService.post<RecouvrementCase>(
      `/admin/recouvrement/cases/${caseId}/resolve`,
      input,
    );
  }

  writeOff(caseId: string, input: ResolveCaseInput): Promise<RecouvrementCase> {
    return httpService.post<RecouvrementCase>(
      `/admin/recouvrement/cases/${caseId}/write-off`,
      input,
    );
  }

}

export const recouvrementRepository = new RecouvrementRepository();
