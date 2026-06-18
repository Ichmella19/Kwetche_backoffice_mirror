import type { LucideIcon } from "lucide-react";
import { Card } from "@/presentation/components/ui/card";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

type Tone = "primary" | "secondary" | "accent" | "info" | "warning";

const TONES: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary-soft-foreground",
  secondary: "bg-secondary-soft text-secondary-soft-foreground",
  accent: "bg-accent-soft text-accent-soft-foreground",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
};

interface StatCardProps {
  label: string;
  value?: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
  isLoading?: boolean;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  isLoading,
}: StatCardProps) {
  return (
    <Card className="flex items-center gap-4 p-5">
      {Icon && (
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl",
            TONES[tone],
          )}
        >
          <Icon className="size-6" />
        </span>
      )}
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm text-muted">{label}</p>
        {isLoading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {value ?? "—"}
          </p>
        )}
        {hint && !isLoading && <p className="text-xs text-muted">{hint}</p>}
      </div>
    </Card>
  );
}
