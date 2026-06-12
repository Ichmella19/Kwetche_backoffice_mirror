import { httpService } from "@/core/data/http.service";
import type {
  ITontineRepository,
  ListTontinesParams,
} from "@/core/domain/repositories/tontine";
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

const csv = (v?: string[]) =>
  v && v.length > 0 ? v.join(",") : undefined;

export class TontineRepository implements ITontineRepository {
  list({
    page = 1,
    perPage = 20,
    status,
    search,
    statuses,
    types,
    frequencies,
    drawModes,
    startFrom,
    startTo,
    sort,
  }: ListTontinesParams): Promise<TontineListResponse> {
    return httpService.get<TontineListResponse>("/admin/tontines", {
      query: {
        page,
        per_page: perPage,
        status,
        search,
        statuses: csv(statuses),
        types: csv(types),
        frequencies: csv(frequencies),
        draw_modes: csv(drawModes),
        start_from: startFrom,
        start_to: startTo,
        sort,
      },
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

  listPendingStart(): Promise<TontinePendingStartResponse> {
    return httpService.get<TontinePendingStartResponse>(
      "/admin/tontines/pending-start",
    );
  }

  ledger(
    id: string,
    params: { page?: number; perPage?: number; purpose?: string; movement?: string } = {},
  ): Promise<InternalLedgerResponse> {
    return httpService.get<InternalLedgerResponse>(
      `/admin/tontines/${id}/ledger`,
      {
        query: {
          page: params.page,
          per_page: params.perPage,
          purpose: params.purpose,
          movement: params.movement,
        },
      },
    );
  }

  notifyMembers(
    id: string,
    input: NotifyTontineMembersInput,
  ): Promise<NotifyTontineMembersResult> {
    return httpService.post<NotifyTontineMembersResult>(
      `/admin/tontines/${id}/notify`,
      input,
    );
  }

  exportMembers(id: string): Promise<void> {
    return httpService.download(
      `/admin/tontines/${id}/export`,
      `tontine_${id}_membres.csv`,
    );
  }
}

export const tontineRepository = new TontineRepository();
