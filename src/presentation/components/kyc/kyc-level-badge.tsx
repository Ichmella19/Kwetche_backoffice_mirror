import { Badge, type BadgeProps } from "@/presentation/components/ui/badge";

const VARIANT: Record<number, BadgeProps["variant"]> = {
  0: "neutral",
  1: "secondary",
  2: "accent",
  3: "primary",
};

/** Badge compact pour un niveau KYC ciblé (1, 2 ou 3). */
export function KycLevelBadge({ level }: { level: number }) {
  return <Badge variant={VARIANT[level] ?? "neutral"}>Niveau {level}</Badge>;
}
