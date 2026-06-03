import type {
  CreateTontineInput,
  Tontine,
  TontineDetail,
  TontineListResponse,
  TontineWithdrawalRequest,
  UpdateTontineInput,
} from "@/lib/types";

export interface ITontineRepository {
  list(params: {
    page: number;
    perPage: number;
    status?: string;
    search?: string;
  }): Promise<TontineListResponse>;
  create(input: CreateTontineInput): Promise<Tontine>;
  update(id: string, input: UpdateTontineInput): Promise<Tontine>;
  detail(id: string): Promise<TontineDetail>;
  publish(id: string): Promise<Tontine>;
  start(id: string): Promise<Tontine>;
  postpone(id: string, newStartDate: string): Promise<Tontine>;
  cancel(id: string): Promise<Tontine>;
  listWithdrawals(id: string): Promise<TontineWithdrawalRequest[]>;
}
