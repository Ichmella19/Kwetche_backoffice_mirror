/**
 * Service Recouvrement : file des dossiers, assignation, actions, résolution.
 */

import { recouvrementRepository } from "@/core/data/repositories/recouvrement";
import type {
  AddRecouvrementActionInput,
  RecouvrementCase,
  RecouvrementCaseDetail,
  RecouvrementCaseListResponse,
  ResolveCaseInput,
} from "@/lib/types";

class RecouvrementService {
  listCases(params: {
    page?: number;
    perPage?: number;
    status?: string;
    assignedAgentId?: string;
  } = {}): Promise<RecouvrementCaseListResponse> {
    return recouvrementRepository.listCases({
      page: params.page ?? 1,
      perPage: params.perPage ?? 20,
      status: params.status,
      assignedAgentId: params.assignedAgentId,
    });
  }

  getCase(caseId: string): Promise<RecouvrementCaseDetail> {
    return recouvrementRepository.getCase(caseId);
  }

  assignSelf(caseId: string): Promise<RecouvrementCase> {
    return recouvrementRepository.assignSelf(caseId);
  }

  addAction(caseId: string, input: AddRecouvrementActionInput) {
    return recouvrementRepository.addAction(caseId, input);
  }

  resolve(caseId: string, input: ResolveCaseInput): Promise<RecouvrementCase> {
    return recouvrementRepository.resolve(caseId, input);
  }

  writeOff(caseId: string, input: ResolveCaseInput): Promise<RecouvrementCase> {
    return recouvrementRepository.writeOff(caseId, input);
  }
}

export const recouvrementService = new RecouvrementService();
