/**
 * Barrel des énumérations du domaine Kwetche.
 * Chaque domaine a son dossier (calqué sur `app/commons/enums/*` de l'API).
 */

export { UserRole, ADMIN_ROLES, KycLevel, Sexe } from "./user-roles/roles";
export { Grant } from "./grants/grants";
export { KycDocumentType } from "./kyc/document-type";
export {
  KycRequestStatus,
  KYC_REQUEST_STATUS_LABELS,
  kycRequestStatusLabel,
} from "./kyc/request-status";
export { Validation, VALIDATION_LABELS, validationLabel } from "./validation";
export {
  NotificationType,
  NotificationChannel,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_CHANNEL_LABELS,
} from "./notification/notification";
export {
  WalletMovement,
  WalletTxStatus,
  WALLET_TX_STATUS_LABELS,
  WALLET_TX_CATEGORY_LABELS,
  WALLET_STATUS_LABELS,
} from "./wallet/wallet";
export { SettingValueType } from "./settings/value-type";
export { ErrorReason } from "./reasons/reasons";
export {
  TontineType,
  TontineDrawMode,
  TontineStatus,
  TontineFrequency,
  TontineMemberStatus,
  CautionStatus,
  ContributionStatus,
  TontinePayoutStatus,
  TONTINE_TYPE_LABELS,
  TONTINE_DRAW_MODE_LABELS,
  TONTINE_STATUS_LABELS,
  TONTINE_FREQUENCY_LABELS,
  TONTINE_MEMBER_STATUS_LABELS,
  CAUTION_STATUS_LABELS,
  CONTRIBUTION_STATUS_LABELS,
  TONTINE_PAYOUT_STATUS_LABELS,
} from "./tontine/tontine";
export {
  DebtType,
  DebtStatus,
  RelanceChannel,
  RelanceStatus,
  RecouvrementCaseStatus,
  RecouvrementActionType,
  DEBT_TYPE_LABELS,
  DEBT_STATUS_LABELS,
  RELANCE_CHANNEL_LABELS,
  RELANCE_STATUS_LABELS,
  RECOUVREMENT_CASE_STATUS_LABELS,
  RECOUVREMENT_ACTION_TYPE_LABELS,
} from "./recouvrement/recouvrement";
