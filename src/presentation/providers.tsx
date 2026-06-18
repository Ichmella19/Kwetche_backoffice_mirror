"use client";

/**
 * Composition des providers globaux, montée une seule fois dans le layout racine.
 */

import type { ReactNode } from "react";
import { ThemeProvider } from "@/presentation/contexts/theme-context";
import { ToastProvider } from "@/presentation/contexts/toast-context";
import { AuthProvider } from "@/presentation/contexts/auth-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
