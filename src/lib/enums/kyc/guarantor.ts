/**
 * Lien du garant moral (KYC niveau 3).
 * Miroir de `app/commons/enums/guarantor/guarantor_relationship.py`.
 */

export enum GuarantorRelationship {
  PARENT = "parent",
  SPOUSE = "spouse",
  SIBLING = "sibling",
  CHILD = "child",
  FRIEND = "friend",
  COLLEAGUE = "colleague",
  OTHER = "other",
}

export const GUARANTOR_RELATIONSHIP_LABELS: Record<string, string> = {
  [GuarantorRelationship.PARENT]: "Parent",
  [GuarantorRelationship.SPOUSE]: "Conjoint(e)",
  [GuarantorRelationship.SIBLING]: "Frère / sœur",
  [GuarantorRelationship.CHILD]: "Enfant majeur",
  [GuarantorRelationship.FRIEND]: "Ami(e)",
  [GuarantorRelationship.COLLEAGUE]: "Collègue / employeur",
  [GuarantorRelationship.OTHER]: "Autre",
};

export const guarantorRelationshipLabel = (
  value: string | null | undefined,
): string | null =>
  value ? (GUARANTOR_RELATIONSHIP_LABELS[value] ?? value) : null;
