import { Badge, type BadgeProps } from "@/presentation/components/ui/badge";
import { KYC_STATUS_LABELS } from "@/lib/constants";
import { KycDocumentStatus } from "@/lib/enums";

const VARIANT: Record<string, BadgeProps["variant"]> = {
  [KycDocumentStatus.PENDING]: "warning",
  [KycDocumentStatus.APPROVED]: "success",
  [KycDocumentStatus.REJECTED]: "danger",
};

export function KycStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={VARIANT[status] ?? "neutral"}>
      {KYC_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
