/**
 * Barrel des énumérations du domaine Kwetche.
 * Chaque domaine a son dossier (calqué sur `app/commons/enums/*` de l'API).
 */

export { UserRole, ADMIN_ROLES, KycLevel, Sexe } from "./user-roles/roles";
export { Grant } from "./grants/grants";
export { KycDocumentType, KycDocumentStatus } from "./kyc/document-type";
export { Validation, VALIDATION_LABELS, validationLabel } from "./validation";
export { SettingValueType } from "./settings/value-type";
export { ErrorReason } from "./reasons/reasons";
