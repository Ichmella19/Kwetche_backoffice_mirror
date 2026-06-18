import type {
  AddRecouvrementActionInput,
  RecouvrementAction,
  RecouvrementCase,
  RecouvrementCaseDetail,
  RecouvrementCaseListResponse,
  ResolveCaseInput,
} from "@/lib/types";

export interface ListRecouvrementCasesParams {
  page?: number;
  perPage?: number;
  status?: string;
  assignedAgentId?: string;
  statuses?: string[];
  userId?: string;
  amountMin?: number;
  amountMax?: number;
  openedFrom?: string;
  openedTo?: string;
  unassigned?: boolean;
  sort?: string;
}

export interface IRecouvrementRepository {
  listCases(
    params: ListRecouvrementCasesParams,
  ): Promise<RecouvrementCaseListResponse>;
  getCase(caseId: string): Promise<RecouvrementCaseDetail>;
  assignSelf(caseId: string): Promise<RecouvrementCase>;
  addAction(
    caseId: string,
    input: AddRecouvrementActionInput,
  ): Promise<{ action: RecouvrementAction; case: RecouvrementCase }>;
  resolve(caseId: string, input: ResolveCaseInput): Promise<RecouvrementCase>;
  writeOff(caseId: string, input: ResolveCaseInput): Promise<RecouvrementCase>;
}
