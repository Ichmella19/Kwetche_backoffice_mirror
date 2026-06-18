import type { User } from "@/lib/types/user";

export interface DeviceInfo {
  device_id: string;
  device_name: string;
  app_version: string;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  country_code?: string;
  password: string;
}

export interface LoginResult {
  user: User;
  access_token: string;
  session_id: string | null;
}
