/**
 * Service Tontine (staff) : CRUD + transitions (publish/start/postpone/cancel).
 * L'avancement des cycles est 100 % automatique (scheduler).
 */

import { tontineRepository } from "@/core/data/repositories/tontine";
import type {
  CreateTontineInput,
  Tontine,
  TontineDetail,
  TontineListResponse,
  TontineWithdrawalRequest,
  UpdateTontineInput,
} from "@/lib/types";

class TontineService {
  list(params: {
    page?: number;
    perPage?: number;
    status?: string;
    search?: string;
  } = {}): Promise<TontineListResponse> {
    return tontineRepository.list({
      page: params.page ?? 1,
      perPage: params.perPage ?? 20,
      status: params.status,
      search: params.search,
    });
  }

  create(input: CreateTontineInput): Promise<Tontine> {
    return tontineRepository.create(input);
  }

  update(id: string, input: UpdateTontineInput): Promise<Tontine> {
    return tontineRepository.update(id, input);
  }

  detail(id: string): Promise<TontineDetail> {
    return tontineRepository.detail(id);
  }

  publish(id: string): Promise<Tontine> {
    return tontineRepository.publish(id);
  }

  start(id: string): Promise<Tontine> {
    return tontineRepository.start(id);
  }

  postpone(id: string, newStartDate: string): Promise<Tontine> {
    return tontineRepository.postpone(id, newStartDate);
  }

  cancel(id: string): Promise<Tontine> {
    return tontineRepository.cancel(id);
  }

  listWithdrawals(id: string): Promise<TontineWithdrawalRequest[]> {
    return tontineRepository.listWithdrawals(id);
  }
}

export const tontineService = new TontineService();
