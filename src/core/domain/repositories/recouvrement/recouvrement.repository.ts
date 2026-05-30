import type {
  AddRecouvrementActionInput,
  RecouvrementAction,
  RecouvrementCase,
  RecouvrementCaseDetail,
  RecouvrementCaseListResponse,
  ResolveCaseInput,
  TontineMember,
} from "@/lib/types";

export interface IRecouvrementRepository {
  listCases(params: {
    page: number;
    perPage: number;
    status?: string;
    assignedAgentId?: string;
  }): Promise<RecouvrementCaseListResponse>;
  getCase(caseId: string): Promise<RecouvrementCaseDetail>;
  assignSelf(caseId: string): Promise<RecouvrementCase>;
  addAction(
    caseId: string,
    input: AddRecouvrementActionInput,
  ): Promise<{ action: RecouvrementAction; case: RecouvrementCase }>;
  resolve(caseId: string, input: ResolveCaseInput): Promise<RecouvrementCase>;
  writeOff(caseId: string, input: ResolveCaseInput): Promise<RecouvrementCase>;
  releaseMember(memberId: string): Promise<TontineMember>;
}
