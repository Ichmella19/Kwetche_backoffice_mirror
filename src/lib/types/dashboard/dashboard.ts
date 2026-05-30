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
}

export interface WalletStats {
  total_balance: number;
  total_locked: number;
  pending_tx: number;
  volume: Record<"24h" | "7d" | "30d", { credit: number; debit: number }>;
}

export interface TontinesStats {
  total: number;
  by_status: Record<string, number>;
  reserve_fund_total: number;
}

export interface RecouvrementStats {
  open_debts: number;
  open_amount_due: number;
  recovered_total: number;
  cases_by_status: Record<string, number>;
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
  signups: TimeseriesPoint[];
  debts_created: TimeseriesPoint[];
  wallet_credit: TimeseriesPoint[];
  wallet_debit: TimeseriesPoint[];
}
