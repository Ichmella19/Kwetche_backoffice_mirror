export interface Debt {
  id: string;
  user_id: string;
  type: string;
  origin_type: string | null;
  origin_id: string | null;
  tontine_id: string | null;
  amount_due: number;
  amount_recovered: number;
  remaining: number;
  currency: string;
  status: string;
  due_date: string | null;
  relance_count: number;
  last_relance_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Relance {
  id: string;
  debt_id: string;
  user_id: string;
  channel: string;
  status: string;
  attempt_no: number;
  message: string | null;
  created_by: string | null;
  sent_at: string | null;
}

export interface RecouvrementCase {
  id: string;
  debt_id: string;
  user_id: string;
  status: string;
  assigned_agent_id: string | null;
  amount_target: number;
  amount_recovered: number;
  opened_at: string | null;
  assigned_at: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
}

export interface RecouvrementAction {
  id: string;
  case_id: string;
  agent_id: string;
  action_type: string;
  note: string | null;
  amount: number | null;
  created_at: string | null;
}

export interface RecouvrementCaseListResponse {
  items: RecouvrementCase[];
  total: number;
  page: number;
  per_page: number;
}

export interface RecouvrementCaseDetail {
  case: RecouvrementCase;
  debt: Debt | null;
  relances: Relance[];
  actions: RecouvrementAction[];
}

export interface AddRecouvrementActionInput {
  action_type: string;
  note?: string | null;
  amount?: number | null;
}

export interface ResolveCaseInput {
  note?: string | null;
}
