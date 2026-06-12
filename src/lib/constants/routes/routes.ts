export const ROUTES = {
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // ── PILOTAGE ────────────────────────────────────────────────
  DASHBOARD: "/dashboard",
  INBOX: "/inbox",
  ANALYTICS: "/analytics",

  // ── UTILISATEURS ────────────────────────────────────────────
  USERS: "/users",
  USER_SESSIONS: "/users/sessions",
  KYC: "/kyc",                      // N1 (identité) — historiquement
  KYC_N2: "/kyc/n2",
  KYC_N3: "/kyc/n3",

  // ── TONTINES ────────────────────────────────────────────────
  TONTINES: "/tontines",
  TONTINE_NEW: "/tontines/new",
  TONTINE_CYCLES: "/tontines/cycles",
  TONTINE_PENDING_START: "/tontines/pending-start",

  // ── FINANCE ─────────────────────────────────────────────────
  WALLETS: "/wallets",
  WALLET_TRANSACTIONS: "/wallets/transactions",
  WALLET_PLATFORM: "/wallets/platform",
  RECOUVREMENT: "/recouvrement",

  // ── RELATION CLIENT ─────────────────────────────────────────
  SUPPORT: "/support",

  // ── ADMINISTRATION ──────────────────────────────────────────
  STAFF: "/staff",
  NOTIFICATIONS: "/notifications",
  SETTINGS: "/settings",
  PROFILE: "/profile",
} as const;
