/**
 * Service d'authentification (cas d'usage).
 * Orchestre le repository auth + la persistance locale + le contrôle d'accès.
 */

import { authRepository } from "@/core/data/repositories";
import { ApiError, httpService } from "@/core/data/http.service";
import { STORAGE_KEYS } from "@/lib/constants";
import { ADMIN_ROLES, Grant, UserRole } from "@/lib/enums";
import { getDeviceInfo } from "@/lib/utils/device";
import type { LoginCredentials, LoginResult, User } from "@/lib/types";

class AuthService {
  /** Connexion par mot de passe (email ou téléphone) réservée aux admins. */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const result = await authRepository.login(credentials, getDeviceInfo());

    if (!this.isAdminUser(result.user)) {
      // Compte valide mais sans accès BO : on referme la session.
      await this.logout().catch(() => undefined);
      throw new ApiError(
        403,
        "Ce compte n'a pas accès au back-office.",
        "user_not_admin",
      );
    }

    this.persistUser(result.user);
    return result;
  }

  async logout(): Promise<void> {
    try {
      await authRepository.logout();
    } finally {
      this.clearSession();
    }
  }

  forgotPassword(identifier: {
    email?: string;
    phone?: string;
    country_code?: string;
  }) {
    return authRepository.forgotPassword(identifier);
  }

  resetPassword(input: {
    email?: string;
    phone?: string;
    country_code?: string;
    code: string;
    new_password: string;
  }) {
    return authRepository.resetPassword(input);
  }

  changePassword(input: {
    current_password: string;
    new_password: string;
  }): Promise<void> {
    return authRepository.changePassword(input);
  }

  /** Recharge le profil depuis l'API et met à jour le cache local. */
  async refreshProfile(): Promise<User> {
    const user = await authRepository.me();
    this.persistUser(user);
    return user;
  }

  getToken(): string | null {
    return httpService.getToken();
  }

  isAuthenticated(): boolean {
    return Boolean(httpService.getToken());
  }

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  persistUser(user: User): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  clearSession(): void {
    httpService.clearToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  isAdminUser(user: User | null): boolean {
    return Boolean(user && ADMIN_ROLES.includes(user.role as UserRole));
  }

  isSuperAdmin(user: User | null): boolean {
    return user?.role === UserRole.SUPER_ADMIN;
  }

  /** super_admin a tous les droits ; sinon on regarde la liste de grants. */
  hasGrant(user: User | null, grant: Grant): boolean {
    if (!user) return false;
    if (this.isSuperAdmin(user)) return true;
    return (user.grants ?? []).includes(grant);
  }
}

export const authService = new AuthService();
