import { httpService } from "@/core/data/http.service";
import type {
  IRecouvrementRepository,
  ListRecouvrementCasesParams,
} from "@/core/domain/repositories/recouvrement";
import type {
  AddRecouvrementActionInput,
  RecouvrementAction,
  RecouvrementCase,
  RecouvrementCaseDetail,
  RecouvrementCaseListResponse,
  ResolveCaseInput,
} from "@/lib/types";

const csv = (v?: string[]) => (v && v.length > 0 ? v.join(",") : undefined);

export class RecouvrementRepository implements IRecouvrementRepository {
  listCases({
    page = 1,
    perPage = 20,
    status,
    assignedAgentId,
    statuses,
    userId,
    amountMin,
    amountMax,
    openedFrom,
    openedTo,
    unassigned,
    sort,
  }: ListRecouvrementCasesParams): Promise<RecouvrementCaseListResponse> {
    return httpService.get<RecouvrementCaseListResponse>(
      "/admin/recouvrement/cases",
      {
        query: {
          page,
          per_page: perPage,
          status,
          assigned_agent_id: assignedAgentId,
          statuses: csv(statuses),
          user_id: userId,
          amount_min: amountMin,
          amount_max: amountMax,
          opened_from: openedFrom,
          opened_to: openedTo,
          unassigned: unassigned ? "true" : undefined,
          sort,
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
