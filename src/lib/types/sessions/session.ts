export interface UserSession {
  id: string;
  user_id: string;
  device_id: string | null;
  device_name: string | null;
  device_ip: string | null;
  user_agent: string | null;
  os: string | null;
  app_version: string | null;
  location: string | null;
  created_at: string | null;
  last_seen_at: string | null;
  revoked_at: string | null;
  is_current?: boolean;
}

export interface RevokeOtherSessionsResult {
  revoked_count: number;
}
