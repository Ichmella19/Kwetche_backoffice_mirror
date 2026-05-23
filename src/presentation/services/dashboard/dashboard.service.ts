/**
 * Service tableau de bord.
 */

import { kycRepository } from "@/core/data/repositories";
import type { DashboardStats } from "@/lib/types";

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const pending = await kycRepository.listPendingDocuments();
    return {
      pendingKyc: pending.length,
    };
  }
}

export const dashboardService = new DashboardService();
