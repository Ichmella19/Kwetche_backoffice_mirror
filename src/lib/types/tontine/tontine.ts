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
  commission_rate: number;
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

export interface TontineDetail {
  tontine: Tontine;
  members: TontineMember[];
  cycles: TontineCycle[];
  payouts?: TontinePayout[];
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
  commission_rate: number;
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
