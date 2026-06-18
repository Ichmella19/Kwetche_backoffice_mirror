/**
 * Statut professionnel déclaré au niveau KYC 2 (revenus / activité).
 * Miroir de `app/commons/enums/employment_status/employment_status.py`.
 */

export enum EmploymentStatus {
  EMPLOYEE = "employee",
  SELF_EMPLOYED = "self_employed",
  ENTREPRENEUR = "entrepreneur",
  UNEMPLOYED = "unemployed",
  RETIRED = "retired",
  STUDENT = "student",
}

export const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  [EmploymentStatus.EMPLOYEE]: "Salarié(e)",
  [EmploymentStatus.SELF_EMPLOYED]: "Indépendant(e) / freelance",
  [EmploymentStatus.ENTREPRENEUR]: "Entrepreneur (IFU/RCCM)",
  [EmploymentStatus.UNEMPLOYED]: "Sans emploi",
  [EmploymentStatus.RETIRED]: "Retraité(e)",
  [EmploymentStatus.STUDENT]: "Étudiant(e)",
};

/** L'utilisateur exploite une activité formelle (IFU + RCCM requis). */
export function isBusinessOwner(status: string | null | undefined): boolean {
  return status === EmploymentStatus.ENTREPRENEUR;
}
