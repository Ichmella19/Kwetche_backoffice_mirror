/**
 * Service Tontine (staff) : CRUD + transitions (publish/start/postpone/cancel).
 * L'avancement des cycles est 100 % automatique (scheduler).
 */

import { tontineRepository } from "@/core/data/repositories/tontine";
import type { ListTontinesParams } from "@/core/domain/repositories/tontine";
import type {
  CreateTontineInput,
  InternalLedgerResponse,
  NotifyTontineMembersInput,
  NotifyTontineMembersResult,
  Tontine,
  TontineDetail,
  TontineListResponse,
  TontinePendingStartResponse,
  TontineWithdrawalRequest,
  UpdateTontineInput,
} from "@/lib/types";

class TontineService {
  list(params: ListTontinesParams = {}): Promise<TontineListResponse> {
    return tontineRepository.list({
      page: params.page ?? 1,
      perPage: params.perPage ?? 20,
      ...params,
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

  listPendingStart(): Promise<TontinePendingStartResponse> {
    return tontineRepository.listPendingStart();
  }

  ledger(
    id: string,
    params?: { page?: number; perPage?: number; purpose?: string; movement?: string },
  ): Promise<InternalLedgerResponse> {
    return tontineRepository.ledger(id, params);
  }

  notifyMembers(
    id: string,
    input: NotifyTontineMembersInput,
  ): Promise<NotifyTontineMembersResult> {
    return tontineRepository.notifyMembers(id, {
      ...input,
      title: input.title.trim(),
      body: input.body.trim(),
    });
  }

  exportMembers(id: string): Promise<void> {
    return tontineRepository.exportMembers(id);
  }
}

export const tontineService = new TontineService();
