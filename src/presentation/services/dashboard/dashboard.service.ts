/**
 * Service tableau de bord : snapshot global + séries temporelles + inbox.
 * Endpoints backend : `/admin/dashboard/stats`, `/admin/dashboard/timeseries`
 * et `/admin/inbox`.
 */

import { dashboardRepository } from "@/core/data/repositories";
import type { AnalyticsRangeParams } from "@/core/domain/repositories/dashboard";
import type {
  DashboardStats,
  DashboardTimeseries,
  InboxResponse,
} from "@/lib/types";

class DashboardService {
  getStats(): Promise<DashboardStats> {
    return dashboardRepository.stats();
  }

  getTimeseries(
    params: AnalyticsRangeParams = { days: 30 },
  ): Promise<DashboardTimeseries> {
    return dashboardRepository.timeseries(params);
  }

  getInbox(limitPerCategory: number = 50): Promise<InboxResponse> {
    return dashboardRepository.inbox(limitPerCategory);
  }
}

export const dashboardService = new DashboardService();
