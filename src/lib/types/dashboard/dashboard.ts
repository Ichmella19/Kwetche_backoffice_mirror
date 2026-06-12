/**
 * Snapshot global de l'activité plateforme — `GET /api/admin/dashboard/stats`.
 * Tous les montants en XOF.
 */
export interface DashboardStats {
  users: UserStats;
  kyc: KycStats;
  wallet: WalletStats;
  tontines: TontinesStats;
  recouvrement: RecouvrementStats;
  support: SupportStats;
  generated_at: string;
}

export interface UserStats {
  total: number;
  verified: number;
  disabled: number;
  staff: number;
  /** Par niveau KYC, clé = "0" | "1" | "2" | "3". */
  by_kyc_level: Record<string, number>;
  new_7d: number;
}

export interface KycStats {
  pending_identity: number;
  approved_identity: number;
  declined_identity: number;
  oldest_pending_identity_at: string | null;
  pending_documents_n2: number;
  oldest_pending_doc_n2_at: string | null;
  pending_documents_n3: number;
  oldest_pending_doc_n3_at: string | null;
}

export interface WalletStats {
  total_balance: number;
  total_locked: number;
  pending_tx: number;
  oldest_pending_tx_at: string | null;
  volume: Record<"24h" | "7d" | "30d", { credit: number; debit: number }>;
}

export interface SupportStats {
  open_tickets: number;
  oldest_open_ticket_at: string | null;
  by_status: Record<string, number>;
}

export interface TontinesStats {
  total: number;
  by_status: Record<string, number>;
  pending_start: number;
  reserve_fund_total: number;
}

export interface RecouvrementStats {
  open_debts: number;
  open_amount_due: number;
  recovered_total: number;
  oldest_open_debt_at: string | null;
  cases_by_status: Record<string, number>;
}

/** Entrée dans la file d'attente unifiée (`GET /admin/inbox`). */
export interface InboxItem {
  kind: string;
  priority: number;
  user_id: string;
  user_label: string;
  since: string | null;
  subject: string;
  amount?: number | null;
  ref_id?: string | null;
}

export interface InboxResponse {
  items: InboxItem[];
  total: number;
  generated_at: string;
}

/** Point sur une série temporelle. */
export interface TimeseriesPoint {
  /** `YYYY-MM-DD`. */
  date: string;
  value: number;
}

/** Réponse de `GET /api/admin/dashboard/timeseries`. */
export interface DashboardTimeseries {
  days: number;
  start_date?: string;
  end_date?: string;
  signups: TimeseriesPoint[];
  debts_created: TimeseriesPoint[];
  wallet_credit: TimeseriesPoint[];
  wallet_debit: TimeseriesPoint[];
}

export interface UserAnalyticsActivity {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  actor_id?: string | null;
  actor_role?: string | null;
  amount?: number;
  status?: string;
  created_at: string;
}

export interface UserAnalytics {
  user_id: string;
  days: number;
  start_date: string;
  end_date: string;
  summary: {
    kyc_level: number;
    login_count: number;
    last_login_at: string | null;
    active_sessions: number;
  };
  wallet: {
    credit: number;
    debit: number;
    net: number;
    transaction_count: number;
  };
  tontines: {
    total_memberships: number;
    active_memberships: number;
    caution_total: number;
  };
  debts: {
    total: number;
    open: number;
    amount_due: number;
    recovered: number;
  };
  notifications: {
    sent: number;
    unread: number;
  };
  timeseries: DashboardTimeseries;
  activity: UserAnalyticsActivity[];
  generated_at: string;
}
