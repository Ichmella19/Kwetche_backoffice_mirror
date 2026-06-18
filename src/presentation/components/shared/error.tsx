"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/** Bloc d'erreur réutilisable avec action « Réessayer ». */
export function ErrorState({
  title = "Une erreur est survenue",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface p-10 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft">
        <AlertTriangle className="size-6 text-danger" />
      </span>
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{title}</p>
        {message && <p className="text-sm text-muted">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}
