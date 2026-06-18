import { httpService } from "@/core/data/http.service";
import type { IAuthRepository } from "@/core/domain/repositories";
import type {
  DeviceInfo,
  LoginCredentials,
  LoginResult,
  User,
} from "@/lib/types";

export class AuthRepository implements IAuthRepository {
  async login(
    credentials: LoginCredentials,
    device: DeviceInfo,
  ): Promise<LoginResult> {
    const result = await httpService.post<LoginResult>(
      "/admin/auth/login",
      { ...credentials, ...device },
      { anonymous: true },
    );
    httpService.setToken(result.access_token);
    return result;
  }

  async logout(fcmToken?: string): Promise<void> {
    try {
      await httpService.post("/auth/logout", { fcm_token: fcmToken });
    } finally {
      httpService.clearToken();
    }
  }

  async forgotPassword(identifier: {
    email?: string;
    phone?: string;
    country_code?: string;
  }): Promise<void> {
    await httpService.post("/auth/forgot_password", identifier, {
      anonymous: true,
    });
  }

  async resetPassword(input: {
    email?: string;
    phone?: string;
    country_code?: string;
    code: string;
    new_password: string;
  }): Promise<void> {
    await httpService.post("/auth/reset_password", input, { anonymous: true });
  }

  async changePassword(input: {
    current_password: string;
    new_password: string;
  }): Promise<void> {
    await httpService.post("/auth/change_password", input);
  }

  me(): Promise<User> {
    return httpService.get<User>("/user/me");
  }
}

export const authRepository = new AuthRepository();
