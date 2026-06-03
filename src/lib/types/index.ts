/**
 * Barrel des types du domaine Kwetche.
 * Chaque domaine garde ses contrats dans son propre dossier.
 */

export type { ApiResponse, Paginated } from "./api";
export type { DeviceInfo, LoginCredentials, LoginResult } from "./auth";
export type {
  DashboardStats,
  DashboardTimeseries,
  KycStats,
  RecouvrementStats,
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
  KycDocumentRequest,
  KycIdentityPendingResponse,
  KycIdentityReview,
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
  TontineListResponse,
  CreateTontineInput,
  UpdateTontineInput,
  TontineWithdrawalRequest,
  TontineWithdrawalRequestUserMini,
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
