/**
 * Support — miroir de `app/commons/enums/support/*`.
 */

export enum SupportTicketStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

export enum SupportTicketCategory {
  ACCOUNT = "account",
  KYC = "kyc",
  WALLET = "wallet",
  TONTINE = "tontine",
  PAYMENT = "payment",
  BUG = "bug",
  OTHER = "other",
}

export const SUPPORT_STATUS_LABELS: Record<string, string> = {
  [SupportTicketStatus.OPEN]: "Ouvert",
  [SupportTicketStatus.IN_PROGRESS]: "En cours",
  [SupportTicketStatus.RESOLVED]: "Répondu",
  [SupportTicketStatus.CLOSED]: "Clos",
};

export const SUPPORT_CATEGORY_LABELS: Record<string, string> = {
  [SupportTicketCategory.ACCOUNT]: "Compte",
  [SupportTicketCategory.KYC]: "Vérification (KYC)",
  [SupportTicketCategory.WALLET]: "Wallet",
  [SupportTicketCategory.TONTINE]: "Tontine",
  [SupportTicketCategory.PAYMENT]: "Paiement",
  [SupportTicketCategory.BUG]: "Bug",
  [SupportTicketCategory.OTHER]: "Autre",
};
