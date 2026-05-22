import type {
  DeviceInfo,
  LoginCredentials,
  LoginResult,
  User,
} from "@/lib/types";

export interface IAuthRepository {
  login(
    credentials: LoginCredentials,
    device: DeviceInfo,
  ): Promise<LoginResult>;
  logout(fcmToken?: string): Promise<void>;
  forgotPassword(identifier: {
    email?: string;
    phone?: string;
    country_code?: string;
  }): Promise<void>;
  resetPassword(input: {
    email?: string;
    phone?: string;
    country_code?: string;
    code: string;
    new_password: string;
  }): Promise<void>;
  changePassword(input: {
    current_password: string;
    new_password: string;
  }): Promise<void>;
  me(): Promise<User>;
}
