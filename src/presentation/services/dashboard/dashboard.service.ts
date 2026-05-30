/**
 * Service tableau de bord : snapshot global + séries temporelles.
 * Endpoints backend : `/admin/dashboard/stats` et `/admin/dashboard/timeseries`.
 */

import { dashboardRepository } from "@/core/data/repositories";
import type { DashboardStats, DashboardTimeseries } from "@/lib/types";

class DashboardService {
  getStats(): Promise<DashboardStats> {
    return dashboardRepository.stats();
  }

  getTimeseries(days = 30): Promise<DashboardTimeseries> {
    return dashboardRepository.timeseries(days);
  }
}

export const dashboardService = new DashboardService();
