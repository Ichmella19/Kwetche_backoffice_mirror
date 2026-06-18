/**
 * Notifications — miroir de `app/commons/enums/notification/*`.
 */

export enum NotificationType {
  ACCOUNT = "account",
  KYC = "kyc",
  WALLET = "wallet",
  TONTINE = "tontine",
  CONTRIBUTION_DUE = "contribution_due",
  PAYMENT_RECEIVED = "payment_received",
  RECOUVREMENT = "recouvrement",
  SYSTEM = "system",
}

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  [NotificationType.ACCOUNT]: "Compte",
  [NotificationType.KYC]: "KYC",
  [NotificationType.WALLET]: "Wallet",
  [NotificationType.TONTINE]: "Tontine",
  [NotificationType.CONTRIBUTION_DUE]: "Cotisation due",
  [NotificationType.PAYMENT_RECEIVED]: "Paiement reçu",
  [NotificationType.RECOUVREMENT]: "Recouvrement",
  [NotificationType.SYSTEM]: "Système",
};

export enum NotificationChannel {
  PUSH = "push",
  EMAIL = "email",
  SMS = "sms",
  IN_APP = "in_app",
}

export const NOTIFICATION_CHANNEL_LABELS: Record<string, string> = {
  [NotificationChannel.PUSH]: "Push",
  [NotificationChannel.EMAIL]: "Email",
  [NotificationChannel.SMS]: "SMS",
  [NotificationChannel.IN_APP]: "In-app",
};
