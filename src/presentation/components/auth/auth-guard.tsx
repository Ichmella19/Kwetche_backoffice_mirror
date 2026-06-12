"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/presentation/contexts/auth-context";
import { Loading } from "@/presentation/components/shared/loading";
import { ROUTES } from "@/lib/constants";

/**
 * Protège les pages du back-office : redirige vers /login tant que la session
 * n'apos;est pas confirmée. À placer dans le layout (dashboard).
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <Loading fullScreen label="Chargement de la session…" />;
  }

  return <>{children}</>;
}
