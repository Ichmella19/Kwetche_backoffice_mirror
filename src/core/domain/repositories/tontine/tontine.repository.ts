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

export interface ListTontinesParams {
  page?: number;
  perPage?: number;
  status?: string;
  search?: string;
  statuses?: string[];
  types?: string[];
  frequencies?: string[];
  drawModes?: string[];
  startFrom?: string;
  startTo?: string;
  sort?: string;
}

export interface ITontineRepository {
  list(params: ListTontinesParams): Promise<TontineListResponse>;
  create(input: CreateTontineInput): Promise<Tontine>;
  update(id: string, input: UpdateTontineInput): Promise<Tontine>;
  detail(id: string): Promise<TontineDetail>;
  publish(id: string): Promise<Tontine>;
  start(id: string): Promise<Tontine>;
  postpone(id: string, newStartDate: string): Promise<Tontine>;
  cancel(id: string): Promise<Tontine>;
  listWithdrawals(id: string): Promise<TontineWithdrawalRequest[]>;
  listPendingStart(): Promise<TontinePendingStartResponse>;
  ledger(
    id: string,
    params?: { page?: number; perPage?: number; purpose?: string; movement?: string },
  ): Promise<InternalLedgerResponse>;
  notifyMembers(
    id: string,
    input: NotifyTontineMembersInput,
  ): Promise<NotifyTontineMembersResult>;
  /** Télécharge le CSV des membres (download navigateur, auth conservée). */
  exportMembers(id: string): Promise<void>;
}
