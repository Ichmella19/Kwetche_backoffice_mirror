import { httpService } from "@/core/data/http.service";
import type { IUserRepository } from "@/core/domain/repositories";
import type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  RevokeOtherSessionsResult,
  User,
  UserListResponse,
  UserSession,
} from "@/lib/types";

export class UserRepository implements IUserRepository {
  me(): Promise<User> {
    return httpService.get<User>("/user/me");
  }

  updateProfile(data: Partial<User>): Promise<User> {
    return httpService.patch<User>("/user/me", data);
  }

  listUsers(
    params: {
      page?: number;
      perPage?: number;
      search?: string;
      includeDeleted?: boolean;
    } = {},
  ): Promise<UserListResponse> {
    return httpService.get<UserListResponse>("/admin/users", {
      query: {
        page: params.page,
        per_page: params.perPage,
        search: params.search,
        include_deleted: params.includeDeleted,
      },
    });
  }

  createUser(data: AdminCreateUserInput): Promise<User> {
    return httpService.post<User>("/admin/users", data);
  }

  getUser(userId: string): Promise<User> {
    return httpService.get<User>(`/admin/users/${userId}`);
  }

  updateUser(userId: string, data: AdminUpdateUserInput): Promise<User> {
    return httpService.patch<User>(`/admin/users/${userId}`, data);
  }

  setUserPassword(
    userId: string,
    input: { new_password: string; revoke_sessions?: boolean },
  ): Promise<User> {
    return httpService.post<User>(`/admin/users/${userId}/password`, input);
  }

  listUserSessions(userId: string): Promise<UserSession[]> {
    return httpService.get<UserSession[]>(`/admin/users/${userId}/sessions`);
  }

  async revokeUserSession(userId: string, sessionId: string): Promise<void> {
    await httpService.delete(`/admin/users/${userId}/sessions/${sessionId}`);
  }

  revokeUserSessions(userId: string): Promise<RevokeOtherSessionsResult> {
    return httpService.post<RevokeOtherSessionsResult>(
      `/admin/users/${userId}/sessions`,
    );
  }

  disableUser(userId: string, reason?: string): Promise<User> {
    return httpService.post<User>(`/admin/users/${userId}/disable`, { reason });
  }

  enableUser(userId: string, reason?: string): Promise<User> {
    return httpService.post<User>(`/admin/users/${userId}/enable`, { reason });
  }

  deleteUser(userId: string, reason: string): Promise<User> {
    return httpService.delete<User>(`/admin/users/${userId}`, {
      body: { reason },
    });
  }
}

export const userRepository = new UserRepository();
