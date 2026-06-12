import type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  RevokeOtherSessionsResult,
  User,
  UserListResponse,
  UserSession,
} from "@/lib/types";

/** Critères de filtrage / tri pour le listing utilisateurs. */
export interface ListUsersParams {
  page?: number;
  perPage?: number;
  search?: string;
  includeDeleted?: boolean;
  /** Rôles à inclure (`user`, `assistant`, `admin`…). */
  roles?: string[];
  /** Niveaux KYC à inclure (0..3). */
  kycLevels?: number[];
  /** Trois états : `undefined` = tous, `true` = vérifiés, `false` = non vérifiés. */
  isVerified?: boolean;
  /** Idem pour `is_desactivate`. */
  isDesactivate?: boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
  lastLoginFrom?: string;
  /** `created_desc` (défaut) | `created_asc` | `name_asc` | `kyc_desc` | `kyc_asc` | `last_login_desc`. */
  sort?: string;
}

export interface IUserRepository {
  me(): Promise<User>;
  updateProfile(data: Partial<User>): Promise<User>;
  listUsers(params?: ListUsersParams): Promise<UserListResponse>;
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
