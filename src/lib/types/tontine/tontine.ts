export interface Tontine {
  id: string;
  name: string;
  type: string;
  draw_mode: string;
  status: string;
  contribution_amount: number;
  frequency: string;
  total_rounds: number | null;
  max_members: number;
  start_date: string | null;
  currency: string;
  description: string | null;
  created_by: string | null;
  reserve_fund: number;
  caution_fund: number;
  platform_takes_first_round: boolean;
  loyalty_bonus_enabled: boolean;
  loyalty_bonus_rate: number;
  required_kyc_level: number;
  caution_amount: number;
  cancellation_window_days: number;
  cancellation_penalty_rate: number;
  current_cycle_index: number | null;
  member_count?: number;
}

export interface TontineMember {
  id: string;
  tontine_id: string;
  user_id: string;
  status: string;
  payout_order: number | null;
  caution_amount: number;
  caution_status: string;
  first_contribution_tx_id: string | null;
  joined_at: string | null;
}

export interface TontineCycle {
  id: string;
  tontine_id: string;
  index: number;
  due_date: string | null;
  status: string;
  is_platform_round: boolean;
  beneficiary_member_id: string | null;
  payout_id: string | null;
  closed_at: string | null;
}

export interface TontineContribution {
  id: string;
  tontine_id: string;
  cycle_id: string;
  member_id: string;
  user_id: string;
  amount: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  transaction_id: string | null;
}

export interface TontinePayout {
  id: string;
  tontine_id: string;
  cycle_id: string | null;
  beneficiary_user_id: string;
  amount: number;
  status: string;
  transaction_id: string | null;
  validated_by: string | null;
  paid_at: string | null;
}

/** Compte interne d'une tontine (pot / réserve / cautions). */
export interface InternalAccount {
  id: string;
  scope_type: string;
  scope_id: string | null;
  purpose: string;
  label: string;
  balance: number;
  currency: string;
}

export interface TontineAccounts {
  pot: InternalAccount;
  reserve: InternalAccount;
  cautions: InternalAccount;
}

export interface TontineDetail {
  tontine: Tontine;
  members: TontineMember[];
  cycles: TontineCycle[];
  payouts?: TontinePayout[];
  accounts?: TontineAccounts;
}

/** Ligne du relevé comptable interne (`platform_wallet_transactions`). */
export interface InternalLedgerEntry {
  id: string;
  purpose: string;
  movement: string;
  amount: number;
  balance_after: number;
  reference: string | null;
  transfer_id: string | null;
  tontine_id: string | null;
  cycle_id: string | null;
  user_id: string | null;
  related_type: string | null;
  related_id: string | null;
  description: string | null;
  is_automatic: boolean;
  created_at: string | null;
}

export interface InternalLedgerResponse {
  items: InternalLedgerEntry[];
  total: number;
  page: number;
  per_page: number;
}

export interface TontineListResponse {
  items: Tontine[];
  total: number;
  page: number;
  per_page: number;
}

export interface CreateTontineInput {
  name: string;
  type: string;
  draw_mode: string;
  contribution_amount: number;
  frequency: string;
  max_members: number;
  total_rounds?: number | null;
  start_date?: string | null;
  required_kyc_level: number;
  caution_amount: number;
  cancellation_window_days: number;
  cancellation_penalty_rate: number;
  platform_takes_first_round: boolean;
  loyalty_bonus_enabled: boolean;
  loyalty_bonus_rate: number;
  description?: string | null;
}

/**
 * Édition d'une tontine en `draft`. Tous les champs sont optionnels :
 * seuls ceux fournis sont modifiés côté backend.
 */
export type UpdateTontineInput = Partial<CreateTontineInput>;

export interface TontineWithdrawalRequestUserMini {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  country_code: string | null;
  email: string | null;
}

export interface TontineWithdrawalRequest {
  id: string;
  tontine_id: string;
  user_id: string;
  member_id: string;
  reason: string;
  supporting_document_url: string | null;
  caution_amount: number;
  penalty_amount: number;
  refunded_amount: number;
  in_penalty_window: boolean;
  created_at: string | null;
  user?: TontineWithdrawalRequestUserMini | null;
}

/** Ligne de la file « à démarrer » (`GET /admin/tontines/pending-start`). */
export interface TontinePendingStartItem extends Tontine {
  joined_members: number;
  missing_members: number;
}

export interface TontinePendingStartResponse {
  items: TontinePendingStartItem[];
  total: number;
}

/** Audience d'une notification ciblée à une tontine. */
export type TontineNotifyAudience =
  | "all"
  | "active"
  | "pending"
  | "defaulted";

export interface NotifyTontineMembersInput {
  title: string;
  body: string;
  audience: TontineNotifyAudience;
  /** Canaux : `in_app` | `push` | `email` | `sms`. */
  channels: string[];
}

export interface NotifyTontineMembersResult {
  audience: string;
  recipients: number;
  sent: number;
  channels: string[];
}
