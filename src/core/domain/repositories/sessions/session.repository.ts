import type { RevokeOtherSessionsResult, UserSession } from "@/lib/types";

export interface ISessionRepository {
  listMine(): Promise<UserSession[]>;
  revoke(sessionId: string): Promise<void>;
  revokeOthers(): Promise<RevokeOtherSessionsResult>;
}
