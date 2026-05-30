import { httpService } from "@/core/data/http.service";
import type { IDashboardRepository } from "@/core/domain/repositories/dashboard";
import type { DashboardStats, DashboardTimeseries } from "@/lib/types";

export class DashboardRepository implements IDashboardRepository {
  stats(): Promise<DashboardStats> {
    return httpService.get<DashboardStats>("/admin/dashboard/stats");
  }

  timeseries(days: number): Promise<DashboardTimeseries> {
    return httpService.get<DashboardTimeseries>("/admin/dashboard/timeseries", {
      query: { days },
    });
  }
}

export const dashboardRepository = new DashboardRepository();
