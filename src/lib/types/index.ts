/**
 * Barrel des types du domaine Kwetche.
 * Chaque domaine garde ses contrats dans son propre dossier.
 */

export type { ApiResponse, Paginated } from "./api";
export type { DeviceInfo, LoginCredentials, LoginResult } from "./auth";
export type {
  DashboardStats,
  DashboardTimeseries,
  InboxItem,
  InboxResponse,
  KycStats,
  RecouvrementStats,
  SupportStats,
  TimeseriesPoint,
  TontinesStats,
  UserAnalytics,
  UserAnalyticsActivity,
  UserStats,
  WalletStats,
} from "./dashboard";
export type {
  CreateDocumentRequestInput,
  KycDocument,
  KycHistoryEntry,
  KycDocumentRequest,
  KycDossierDetail,
  KycDossierListItem,
  KycDossierListResponse,
  KycDossierUserMini,
  KycGuarantee,
  KycIdentityPendingResponse,
  KycIdentityReview,
  KycProfileN2,
  KycProfileN3,
  ReviewGuaranteeInput,
  ReviewKycDocumentInput,
  ReviewKycIdentityInput,
} from "./kyc";
export type {
  SendNotificationInput,
  SendNotificationResult,
} from "./notification";
export type {
  Wallet,
  WalletOwner,
  WalletTransaction,
  WalletTransactionsResponse,
  WalletUserView,
  AdjustWalletInput,
  WalletListResponse,
  PlatformWallet,
  PlatformWalletTransaction,
  PlatformWalletTransactionsResponse,
  PlatformWalletMovementInput,
} from "./wallet";
export type { AppSetting } from "./settings";
export type { RevokeOtherSessionsResult, UserSession } from "./sessions";
export type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  User,
  UserListResponse,
} from "./user";
export type {
  Tontine,
  TontineMember,
  TontineCycle,
  TontineContribution,
  TontinePayout,
  TontineDetail,
  TontineAccounts,
  InternalAccount,
  InternalLedgerEntry,
  InternalLedgerResponse,
  TontineListResponse,
  CreateTontineInput,
  UpdateTontineInput,
  TontineWithdrawalRequest,
  TontineWithdrawalRequestUserMini,
  TontinePendingStartItem,
  TontinePendingStartResponse,
  TontineNotifyAudience,
  NotifyTontineMembersInput,
  NotifyTontineMembersResult,
} from "./tontine/tontine";
export type {
  Debt,
  Relance,
  RecouvrementCase,
  RecouvrementAction,
  RecouvrementStageEvent,
  RecouvrementCaseListResponse,
  RecouvrementCaseDetail,
  AddRecouvrementActionInput,
  AdvanceStageInput,
  ResolveCaseInput,
} from "./recouvrement/recouvrement";
export type {
  SupportTicket,
  SupportTicketUserMini,
  SupportTicketListResponse,
  SupportAttachment,
  SupportMessage,
  SupportTicketThread,
  UpdateSupportStatusInput,
} from "./support";
