/**
 * Codes machine renvoyés sur les 401/403 (champ `reason`).
 * Permet une réaction programmatique sans parser le message texte.
 * Miroir de `app/commons/enums/reasons/reasons.py` (ReasonFor403).
 */

export enum ErrorReason {
  ACCOUNT_NOT_FOUND = "account_not_found",
  ACCOUNT_NOT_VERIFIED = "account_not_verified",
  ACCOUNT_DISABLED = "account_disabled",
  ACCOUNT_DELETED = "account_deleted",
  ACCOUNT_ALREADY_VERIFIED = "account_already_verified",

  INCORRECT_PASSWORD = "incorrect_password",
  NO_PASSWORD_SET = "no_password_set",
  MISSING_IDENTIFIER = "missing_identifier",
  BAD_ROLE = "bad_role",

  OTP_INVALID = "otp_invalid",
  OTP_EXPIRED = "otp_expired",
  VERIFICATION_CODE_INVALID = "verification_code_invalid",
  RESET_CODE_INVALID = "reset_code_invalid",
  RESET_CODE_EXPIRED = "reset_code_expired",
  RESEND_TOO_SOON = "resend_too_soon",

  TOKEN_MISSING = "token_missing",
  TOKEN_INVALID = "token_invalid",
  TOKEN_EXPIRED = "token_expired",
  SESSION_NOT_FOUND = "session_not_found",
  SESSION_REVOKED = "session_revoked",

  USER_NOT_FOUND = "user_not_found",
  MISSING_GRANT = "missing_grant",
  USER_NOT_ADMIN = "user_not_admin",
  USER_NOT_SUPER_ADMIN = "user_not_super_admin",
  KYC_LEVEL_INSUFFICIENT = "kyc_level_insufficient",
  CIP_NOT_VERIFIED = "cip_not_verified",
  AGE_TOO_LOW = "age_too_low",
}
