"use client";

/**
 * Contexte d'authentification : source de vérité de l'utilisateur connecté
 * pour toute la présentation. Branche aussi la réaction aux 401 (le client
 * HTTP appelle ce handler quand le jeton n'est plus valide).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { httpService } from "@/core/data/http.service";
import { authService } from "@/presentation/services/auth";
import { ROUTES } from "@/lib/constants";
import { Grant } from "@/lib/enums";
import type { LoginCredentials, User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasGrant: (grant: Grant) => boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loggingOut = useRef(false);

  // Réaction centralisée aux 401 : on coupe la session et on revient au login.
  useEffect(() => {
    httpService.setUnauthorizedHandler(() => {
      authService.clearSession();
      setUser(null);
      router.replace(ROUTES.LOGIN);
    });
    return () => httpService.setUnauthorizedHandler(null);
  }, [router]);

  // Bootstrap : restaure depuis le cache puis revalide via /user/me.
  useEffect(() => {
    let active = true;
    // Restaure l'utilisateur depuis le cache local (indisponible au SSR), puis
    // revalide via /user/me ci-dessous — synchro légitime au montage.
    const cached = authService.getCurrentUser();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cached) setUser(cached);

    if (!authService.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    authService
      .refreshProfile()
      .then((fresh) => {
        if (active) setUser(fresh);
      })
      .catch(() => {
        /* le handler 401 s'occupe de la déconnexion si besoin */
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await authService.login(credentials);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    if (loggingOut.current) return;
    loggingOut.current = true;
    try {
      await authService.logout();
    } finally {
      setUser(null);
      loggingOut.current = false;
      router.replace(ROUTES.LOGIN);
    }
  }, [router]);

  const refresh = useCallback(async () => {
    const fresh = await authService.refreshProfile();
    setUser(fresh);
  }, []);

  const hasGrant = useCallback((grant: Grant) => authService.hasGrant(user, grant), [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        refresh,
        hasGrant,
        isSuperAdmin: authService.isSuperAdmin(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un <AuthProvider>.");
  return ctx;
}
