/**
 * Service Tontine (staff) : CRUD + transitions (publish/start/postpone/cancel/advance).
 */

import { tontineRepository } from "@/core/data/repositories/tontine";
import type {
  CreateTontineInput,
  Tontine,
  TontineDetail,
  TontineListResponse,
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

  advance(id: string): Promise<Tontine> {
    return tontineRepository.advance(id);
  }

  cancel(id: string): Promise<Tontine> {
    return tontineRepository.cancel(id);
  }
}

export const tontineService = new TontineService();
