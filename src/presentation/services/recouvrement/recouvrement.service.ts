/**
 * Service Recouvrement : file des dossiers, assignation, actions, résolution.
 */

import { recouvrementRepository } from "@/core/data/repositories/recouvrement";
import type { ListRecouvrementCasesParams } from "@/core/domain/repositories/recouvrement";
import type {
  AddRecouvrementActionInput,
  RecouvrementCase,
  RecouvrementCaseDetail,
  RecouvrementCaseListResponse,
  ResolveCaseInput,
} from "@/lib/types";

class RecouvrementService {
  listCases(
    params: ListRecouvrementCasesParams = {},
  ): Promise<RecouvrementCaseListResponse> {
    return recouvrementRepository.listCases({
      page: params.page ?? 1,
      perPage: params.perPage ?? 20,
      ...params,
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
