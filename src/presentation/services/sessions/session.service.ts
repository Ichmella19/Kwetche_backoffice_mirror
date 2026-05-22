import { sessionRepository } from "@/core/data/repositories";
import type { RevokeOtherSessionsResult, UserSession } from "@/lib/types";

class SessionService {
  listMine(): Promise<UserSession[]> {
    return sessionRepository.listMine();
  }

  revoke(sessionId: string): Promise<void> {
    return sessionRepository.revoke(sessionId);
  }

  revokeOthers(): Promise<RevokeOtherSessionsResult> {
    return sessionRepository.revokeOthers();
  }
}

export const sessionService = new SessionService();
