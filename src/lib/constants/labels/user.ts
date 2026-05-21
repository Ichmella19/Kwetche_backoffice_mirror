import { KycLevel, UserRole } from "@/lib/enums";

export const ROLE_LABELS: Record<string, string> = {
  [UserRole.USER]: "Utilisateur",
  [UserRole.ASSISTANT]: "Assistant",
  [UserRole.ADMIN]: "Administrateur",
  [UserRole.SUPER_ADMIN]: "Super-admin",
};

export const KYC_LEVEL_LABELS: Record<number, string> = {
  [KycLevel.LEVEL_0]: "Niveau 0 · Exploration",
  [KycLevel.LEVEL_1]: "Niveau 1 · CIP vérifié",
  [KycLevel.LEVEL_2]: "Niveau 2 · KYC renforcé",
  [KycLevel.LEVEL_3]: "Niveau 3 · Validation conformité",
};
