/**
 * Wallet — miroir de `app/commons/enums/wallet/*`.
 */

export enum WalletMovement {
  DEBIT = "debit",
  CREDIT = "credit",
}

export enum WalletTxStatus {
  PENDING = "pending",
  VALIDATED = "validated",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export const WALLET_TX_STATUS_LABELS: Record<string, string> = {
  [WalletTxStatus.PENDING]: "En attente",
  [WalletTxStatus.VALIDATED]: "Validée",
  [WalletTxStatus.REJECTED]: "Rejetée",
  [WalletTxStatus.CANCELLED]: "Annulée",
};

export const WALLET_TX_CATEGORY_LABELS: Record<string, string> = {
  deposit: "Dépôt",
  withdrawal: "Retrait",
  contribution: "Cotisation",
  payout: "Versement",
  refund: "Remboursement",
  commission: "Commission",
  fee: "Frais",
  adjustment: "Ajustement",
  bonus: "Bonus",
  debt_settlement: "Règlement dette",
};

export const WALLET_STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  locked: "Bloqué",
};
