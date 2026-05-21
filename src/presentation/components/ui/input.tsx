"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Icône affichée à gauche du champ. */
  leadingIcon?: React.ReactNode;
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", leadingIcon, invalid, ...props }, ref) => (
    <div className="relative w-full">
      {leadingIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted [&_svg]:size-4">
          {leadingIcon}
        </span>
      )}
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground transition-colors",
          "placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          leadingIcon && "pl-9",
          invalid && "border-danger focus:ring-danger",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
Input.displayName = "Input";

export { Input };
