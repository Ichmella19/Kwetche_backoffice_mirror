import { httpService } from "@/core/data/http.service";
import type { ISessionRepository } from "@/core/domain/repositories";
import type { RevokeOtherSessionsResult, UserSession } from "@/lib/types";

export class SessionRepository implements ISessionRepository {
  listMine(): Promise<UserSession[]> {
    return httpService.get<UserSession[]>("/user-sessions");
  }

  async revoke(sessionId: string): Promise<void> {
    await httpService.delete(`/user-sessions/${sessionId}`);
  }

  revokeOthers(): Promise<RevokeOtherSessionsResult> {
    return httpService.post<RevokeOtherSessionsResult>(
      "/user-sessions/revoke_others",
    );
  }
}

export const sessionRepository = new SessionRepository();
