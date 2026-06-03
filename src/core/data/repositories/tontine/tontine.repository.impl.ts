import { httpService } from "@/core/data/http.service";
import type { ITontineRepository } from "@/core/domain/repositories/tontine";
import type {
  CreateTontineInput,
  Tontine,
  TontineDetail,
  TontineListResponse,
  TontineWithdrawalRequest,
  UpdateTontineInput,
} from "@/lib/types";

export class TontineRepository implements ITontineRepository {
  list({
    page,
    perPage,
    status,
    search,
  }: {
    page: number;
    perPage: number;
    status?: string;
    search?: string;
  }): Promise<TontineListResponse> {
    return httpService.get<TontineListResponse>("/admin/tontines", {
      query: { page, per_page: perPage, status, search },
    });
  }

  create(input: CreateTontineInput): Promise<Tontine> {
    return httpService.post<Tontine>("/admin/tontines", input);
  }

  update(id: string, input: UpdateTontineInput): Promise<Tontine> {
    return httpService.put<Tontine>(`/admin/tontines/${id}`, input);
  }

  detail(id: string): Promise<TontineDetail> {
    return httpService.get<TontineDetail>(`/admin/tontines/${id}`);
  }

  publish(id: string): Promise<Tontine> {
    return httpService.post<Tontine>(`/admin/tontines/${id}/publish`);
  }

  start(id: string): Promise<Tontine> {
    return httpService.post<Tontine>(`/admin/tontines/${id}/start`);
  }

  postpone(id: string, newStartDate: string): Promise<Tontine> {
    return httpService.post<Tontine>(`/admin/tontines/${id}/postpone`, {
      start_date: newStartDate,
    });
  }

  cancel(id: string): Promise<Tontine> {
    return httpService.post<Tontine>(`/admin/tontines/${id}/cancel`);
  }

  listWithdrawals(id: string): Promise<TontineWithdrawalRequest[]> {
    return httpService.get<TontineWithdrawalRequest[]>(
      `/admin/tontines/${id}/withdrawals`,
    );
  }
}

export const tontineRepository = new TontineRepository();
