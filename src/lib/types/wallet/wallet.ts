export interface WalletOwner {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  country_code: string | null;
  email: string | null;
  role: string;
  profile_photo: string | null;
  kyc_level: number;
  is_desactivate: boolean;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  locked_balance: number;
  available: number;
  currency: string;
  status: string;
  /** Mini-payload du propriétaire, joint par le backend pour les vues admin. */
  owner?: WalletOwner | null;
}

export interface WalletTransaction {
  id: string;
  movement: string;
  category: string;
  status: string;
  amount: number;
  balance_after: number | null;
  reference: string | null;
  description: string | null;
  created_at: string | null;
}

export interface WalletUserView {
  wallet: Wallet;
  transactions: WalletTransaction[];
  total: number;
  page: number;
  per_page: number;
}

export interface AdjustWalletInput {
  amount: number;
  direction: "credit" | "debit";
  reason: string;
}

export interface WalletListResponse {
  items: Wallet[];
  total: number;
  page: number;
  per_page: number;
}

export interface PlatformWallet {
  id: string;
  purpose: string;
  label: string;
  balance: number;
  currency: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface PlatformWalletTransaction {
  id: string;
  platform_wallet_id: string;
  purpose: string;
  movement: "credit" | "debit";
  amount: number;
  balance_after: number;
  related_type: string | null;
  related_id: string | null;
  description: string | null;
  performed_by: string | null;
  is_automatic: boolean;
  created_at: string | null;
}

export interface PlatformWalletTransactionsResponse {
  wallet: PlatformWallet;
  items: PlatformWalletTransaction[];
  total: number;
  page: number;
  per_page: number;
}

export interface PlatformWalletMovementInput {
  amount: number;
  description: string;
  related_type?: string | null;
  related_id?: string | null;
}
