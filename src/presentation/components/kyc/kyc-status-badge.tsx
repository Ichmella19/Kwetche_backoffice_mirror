import { Badge, type BadgeProps } from "@/presentation/components/ui/badge";
import { Validation, validationLabel } from "@/lib/enums";

const VARIANT: Record<string, BadgeProps["variant"]> = {
  [Validation.APPROVED]: "success",
  [Validation.APPROVED_AND_REUPLOADED]: "success",
  [Validation.DECLINED]: "danger",
  [Validation.BLOCKED]: "danger",
  [Validation.EXPIRED]: "danger",
  [Validation.UPLOADED_AND_WAITING_FOR_APPROVAL]: "warning",
  [Validation.REUPLOADED_AND_WAITING_FOR_APPROVAL]: "warning",
  [Validation.NOT_UPLOADED]: "neutral",
};

/** Badge de statut d'un document KYC (state-machine `Validation`). */
export function KycStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={VARIANT[status] ?? "neutral"}>{validationLabel(status)}</Badge>
  );
}
