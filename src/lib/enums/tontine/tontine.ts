/**
 * Tontine — miroir de `app/commons/enums/tontine/*`.
 */

export enum TontineType {
  ROTATING = "rotating",
  SAVINGS = "savings",
}

export enum TontineDrawMode {
  REVEALED = "revealed",
  RANDOM_PER_TURN = "random_per_turn",
}

export enum TontineStatus {
  DRAFT = "draft",
  OPEN = "open",
  PENDING_START = "pending_start",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum TontineFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  BIWEEKLY = "biweekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  SEMIANNUAL = "semiannual",
  YEARLY = "yearly",
}

export enum TontineMemberStatus {
  PENDING = "pending",
  ACTIVE = "active",
  WITHDRAWN = "withdrawn",
  REMOVED = "removed",
  DEFAULTED = "defaulted",
}

export enum CautionStatus {
  NONE = "none",
  HELD = "held",
  REFUNDED = "refunded",
  FORFEITED = "forfeited",
}

export enum ContributionStatus {
  PENDING = "pending",
  PAID = "paid",
  LATE = "late",
  MISSED = "missed",
  WAIVED = "waived",
}

export enum TontinePayoutStatus {
  SCHEDULED = "scheduled",
  PENDING_VALIDATION = "pending_validation",
  PENDING_DEBT_RESOLUTION = "pending_debt_resolution",
  PAID = "paid",
  SUSPENDED = "suspended",
  CANCELLED = "cancelled",
}

export const TONTINE_TYPE_LABELS: Record<string, string> = {
  [TontineType.ROTATING]: "Cagnotte tournante",
  [TontineType.SAVINGS]: "Épargne collective",
};

export const TONTINE_DRAW_MODE_LABELS: Record<string, string> = {
  [TontineDrawMode.REVEALED]: "Ordre révélé",
  [TontineDrawMode.RANDOM_PER_TURN]: "Tirage à chaque tour",
};

export const TONTINE_STATUS_LABELS: Record<string, string> = {
  [TontineStatus.DRAFT]: "Brouillon",
  [TontineStatus.OPEN]: "Inscriptions ouvertes",
  [TontineStatus.PENDING_START]: "En attente de démarrage",
  [TontineStatus.ACTIVE]: "En cours",
  [TontineStatus.COMPLETED]: "Terminée",
  [TontineStatus.CANCELLED]: "Annulée",
};

export const TONTINE_FREQUENCY_LABELS: Record<string, string> = {
  [TontineFrequency.DAILY]: "Quotidienne",
  [TontineFrequency.WEEKLY]: "Hebdomadaire",
  [TontineFrequency.BIWEEKLY]: "Bimensuelle",
  [TontineFrequency.MONTHLY]: "Mensuelle",
  [TontineFrequency.QUARTERLY]: "Trimestrielle",
  [TontineFrequency.SEMIANNUAL]: "Semestrielle",
  [TontineFrequency.YEARLY]: "Annuelle",
};

export const TONTINE_MEMBER_STATUS_LABELS: Record<string, string> = {
  [TontineMemberStatus.PENDING]: "Inscrit",
  [TontineMemberStatus.ACTIVE]: "Actif",
  [TontineMemberStatus.WITHDRAWN]: "Désisté",
  [TontineMemberStatus.REMOVED]: "Retiré",
  [TontineMemberStatus.DEFAULTED]: "Défaillant",
};

export const CAUTION_STATUS_LABELS: Record<string, string> = {
  [CautionStatus.NONE]: "Aucune",
  [CautionStatus.HELD]: "Bloquée",
  [CautionStatus.REFUNDED]: "Restituée",
  [CautionStatus.FORFEITED]: "Retenue",
};

export const CONTRIBUTION_STATUS_LABELS: Record<string, string> = {
  [ContributionStatus.PENDING]: "À payer",
  [ContributionStatus.PAID]: "Payée",
  [ContributionStatus.LATE]: "En retard",
  [ContributionStatus.MISSED]: "Manquée",
  [ContributionStatus.WAIVED]: "Dispensée",
};

export const TONTINE_PAYOUT_STATUS_LABELS: Record<string, string> = {
  [TontinePayoutStatus.SCHEDULED]: "Programmé",
  [TontinePayoutStatus.PENDING_VALIDATION]: "À valider",
  [TontinePayoutStatus.PENDING_DEBT_RESOLUTION]: "En attente (dette à régler)",
  [TontinePayoutStatus.PAID]: "Versé",
  [TontinePayoutStatus.SUSPENDED]: "Suspendu",
  [TontinePayoutStatus.CANCELLED]: "Annulé",
};
