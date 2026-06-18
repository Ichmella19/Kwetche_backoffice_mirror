/**
 * Service utilisateur : profil de l'administrateur connecté.
 */

import { userRepository } from "@/core/data/repositories";
import type { ListUsersParams } from "@/core/domain/repositories/user";
import type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  RevokeOtherSessionsResult,
  User,
  UserAnalytics,
  UserListResponse,
  UserSession,
} from "@/lib/types";

class UserService {
  me(): Promise<User> {
    return userRepository.me();
  }

  updateProfile(data: Partial<User>): Promise<User> {
    return userRepository.updateProfile(data);
  }

  listUsers(params?: ListUsersParams): Promise<UserListResponse> {
    return userRepository.listUsers(params);
  }

  createUser(data: AdminCreateUserInput): Promise<User> {
    return userRepository.createUser({
      ...data,
      email: data.email?.trim() || null,
    });
  }

  getUser(userId: string): Promise<User> {
    return userRepository.getUser(userId);
  }

  updateUser(userId: string, data: AdminUpdateUserInput): Promise<User> {
    return userRepository.updateUser(userId, {
      ...data,
      email: data.email?.trim() || null,
    });
  }

  setUserPassword(
    userId: string,
    input: { new_password: string; revoke_sessions?: boolean },
  ): Promise<User> {
    return userRepository.setUserPassword(userId, input);
  }

  listUserSessions(userId: string): Promise<UserSession[]> {
    return userRepository.listUserSessions(userId);
  }

  revokeUserSession(userId: string, sessionId: string): Promise<void> {
    return userRepository.revokeUserSession(userId, sessionId);
  }

  revokeUserSessions(userId: string): Promise<RevokeOtherSessionsResult> {
    return userRepository.revokeUserSessions(userId);
  }

  disableUser(userId: string, reason?: string): Promise<User> {
    return userRepository.disableUser(userId, reason?.trim() || undefined);
  }

  enableUser(userId: string, reason?: string): Promise<User> {
    return userRepository.enableUser(userId, reason?.trim() || undefined);
  }

  deleteUser(userId: string, reason: string): Promise<User> {
    return userRepository.deleteUser(userId, reason.trim());
  }

  listUserTontines(userId: string) {
    return userRepository.listUserTontines(userId);
  }

  listUserDebts(userId: string) {
    return userRepository.listUserDebts(userId);
  }

  userAnalytics(
    userId: string,
    params: { days?: number; startDate?: string; endDate?: string } = {},
  ): Promise<UserAnalytics> {
    return userRepository.userAnalytics(userId, params);
  }
}

export const userService = new UserService();
