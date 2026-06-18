"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const SIZES = {
  sm: "size-4",
  md: "size-6",
  lg: "size-9",
} as const;

export interface SpinnerProps {
  size?: keyof typeof SIZES;
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return <Loader2 className={cn("animate-spin text-primary", SIZES[size], className)} />;
}

export interface LoadingProps {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

/** Indicateur centré, ou plein écran si `fullScreen`. */
export function Loading({ label, fullScreen, className }: LoadingProps) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-3 p-8", className)}>
      <Spinner size="lg" />
      {label && <p className="text-sm text-muted">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
        {content}
      </div>
    );
  }
  return content;
}
