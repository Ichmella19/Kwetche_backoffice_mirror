/**
 * Type de garantie produite au niveau KYC 3.
 * Miroir de `app/commons/enums/guarantee/guarantee_type.py`.
 */

export enum GuaranteeType {
  REAL_ESTATE = "real_estate",
  MORTGAGE = "mortgage",
  VEHICLE = "vehicle",
  EQUIPMENT = "equipment",
  CASH_DEPOSIT = "cash_deposit",
  TERM_DEPOSIT = "term_deposit",
  SECURITIES = "securities",
  PERSONAL_GUARANTOR = "personal_guarantor",
  SALARY_DOMICILIATION = "salary_domiciliation",
  OTHER = "other",
}

export const GUARANTEE_TYPE_LABELS: Record<string, string> = {
  [GuaranteeType.REAL_ESTATE]: "Bien immobilier",
  [GuaranteeType.MORTGAGE]: "Hypothèque",
  [GuaranteeType.VEHICLE]: "Véhicule",
  [GuaranteeType.EQUIPMENT]: "Matériel professionnel",
  [GuaranteeType.CASH_DEPOSIT]: "Dépôt cash bloqué",
  [GuaranteeType.TERM_DEPOSIT]: "Compte à terme",
  [GuaranteeType.SECURITIES]: "Titres financiers",
  [GuaranteeType.PERSONAL_GUARANTOR]: "Caution morale (tiers)",
  [GuaranteeType.SALARY_DOMICILIATION]: "Domiciliation salaire",
  [GuaranteeType.OTHER]: "Autre garantie",
};

/**
 * Vrai si un justificatif est obligatoire pour ce type (titre foncier,
 * carte grise, relevé bancaire, etc.).
 */
export function guaranteeRequiresDocument(t: string): boolean {
  return ![GuaranteeType.PERSONAL_GUARANTOR, GuaranteeType.OTHER].includes(
    t as GuaranteeType,
  );
}
