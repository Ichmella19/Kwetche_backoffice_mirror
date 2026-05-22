import type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  RevokeOtherSessionsResult,
  User,
  UserListResponse,
  UserSession,
} from "@/lib/types";

export interface IUserRepository {
  me(): Promise<User>;
  updateProfile(data: Partial<User>): Promise<User>;
  listUsers(params?: {
    page?: number;
    perPage?: number;
    search?: string;
    includeDeleted?: boolean;
  }): Promise<UserListResponse>;
  createUser(data: AdminCreateUserInput): Promise<User>;
  getUser(userId: string): Promise<User>;
  updateUser(userId: string, data: AdminUpdateUserInput): Promise<User>;
  setUserPassword(
    userId: string,
    input: { new_password: string; revoke_sessions?: boolean },
  ): Promise<User>;
  listUserSessions(userId: string): Promise<UserSession[]>;
  revokeUserSession(userId: string, sessionId: string): Promise<void>;
  revokeUserSessions(userId: string): Promise<RevokeOtherSessionsResult>;
  disableUser(userId: string, reason?: string): Promise<User>;
  enableUser(userId: string, reason?: string): Promise<User>;
  deleteUser(userId: string, reason: string): Promise<User>;
}
