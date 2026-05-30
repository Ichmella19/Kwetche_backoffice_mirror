"use client";

import * as React from "react";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Label } from "./label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

interface FieldWithInfoProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  /** Texte affiché dans la bulle d'aide au survol / focus de l'icône info. */
  info: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Variante du `Field` standard avec une **icône info** cliquable / focusable
 * à côté du label. Au survol ou au focus clavier, une bulle Radix Tooltip
 * explique à quoi sert le champ. Idéal pour les formulaires métier denses
 * (création tontine, KYC, paramètres).
 */
export function FieldWithInfo({
  label,
  htmlFor,
  required,
  info,
  error,
  className,
  children,
}: FieldWithInfoProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`À propos de ${label}`}
                className="inline-flex size-4 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="start">
              {info}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {children}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
