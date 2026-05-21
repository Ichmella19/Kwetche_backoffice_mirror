/**
 * Catalogue des grants (permissions fines) `<domaine>.<action>`.
 * `super_admin` contourne ce système et possède tous les droits.
 * Miroir de `app/commons/enums/grants/grants.py`.
 */

export enum Grant {
  USER_READ = "user.read",
  USER_WRITE = "user.write",
  USER_DISABLE = "user.disable",
  USER_DELETE = "user.delete",

  KYC_REVIEW = "kyc.review",
  KYC_APPROVE = "kyc.approve",
  KYC_REJECT = "kyc.reject",

  TONTINE_READ = "tontine.read",
  TONTINE_WRITE = "tontine.write",
  TONTINE_CANCEL = "tontine.cancel",

  WALLET_READ = "wallet.read",
  WALLET_ADJUST = "wallet.adjust",

  LOAN_READ = "loan.read",
  LOAN_APPROVE = "loan.approve",
  LOAN_REJECT = "loan.reject",

  SUPPORT_READ = "support.read",
  SUPPORT_TICKET = "support.ticket",
  SUPPORT_WRITE = "support.write",

  SETTINGS_READ = "settings.read",
  SETTINGS_WRITE = "settings.write",

  AUDIT_READ = "audit.read",
}
