/**
 * Rôles, niveaux KYC et sexe.
 * Miroir de `app/commons/enums/user_roles/roles.py`.
 */

/** Rôles de compte. Seuls `admin` et `super_admin` accèdent au back-office. */
export enum UserRole {
  USER = "user",
  ASSISTANT = "assistant",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

/** Rôles habilités à entrer dans le back-office. */
export const ADMIN_ROLES: UserRole[] = [
  UserRole.ASSISTANT,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

/** Niveaux de vérification KYC (0 à 3). */
export enum KycLevel {
  LEVEL_0 = 0,
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3,
}

export enum Sexe {
  M = "M",
  F = "F",
  OTHER = "other",
}
