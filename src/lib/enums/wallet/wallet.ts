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

export enum PaymentProviderType {
  SANDBOX = "sandbox",
  MTN = "mtn",
  MOOV = "moov",
  CELTIIS = "celtiis",
  CARD = "card",
}

export const PAYMENT_PROVIDER_LABELS: Record<string, string> = {
  [PaymentProviderType.SANDBOX]: "Sandbox (dev)",
  [PaymentProviderType.MTN]: "MTN MoMo",
  [PaymentProviderType.MOOV]: "Moov Money",
  [PaymentProviderType.CELTIIS]: "Celtiis Cash",
  [PaymentProviderType.CARD]: "Carte bancaire",
};

// Comptes « maison » globaux. Réserve / cautions / bonus ne sont PLUS
// globaux — ils vivent par tontine (cf. comptes internes de chaque tontine).
export enum PlatformAccount {
  LOANS = "loans",
  EARNINGS = "earnings",
  OPERATIONAL = "operational",
  TONTINES_IMPAYES = "tontines_impayes",
}

export const PLATFORM_ACCOUNT_LABELS: Record<string, string> = {
  [PlatformAccount.LOANS]: "Prêts",
  [PlatformAccount.EARNINGS]: "Gains plateforme",
  [PlatformAccount.OPERATIONAL]: "Trésorerie opérationnelle",
  [PlatformAccount.TONTINES_IMPAYES]: "Pertes impayées",
};

export enum PlatformMovement {
  CREDIT = "credit",
  DEBIT = "debit",
}

export const PLATFORM_MOVEMENT_LABELS: Record<string, string> = {
  [PlatformMovement.CREDIT]: "Crédit",
  [PlatformMovement.DEBIT]: "Débit",
};
