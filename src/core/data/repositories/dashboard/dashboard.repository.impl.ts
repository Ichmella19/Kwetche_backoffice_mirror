import { httpService } from "@/core/data/http.service";
import type {
  AnalyticsRangeParams,
  IDashboardRepository,
} from "@/core/domain/repositories/dashboard";
import type { DashboardStats, DashboardTimeseries } from "@/lib/types";

export class DashboardRepository implements IDashboardRepository {
  stats(): Promise<DashboardStats> {
    return httpService.get<DashboardStats>("/admin/dashboard/stats");
  }

  timeseries(params: AnalyticsRangeParams = {}): Promise<DashboardTimeseries> {
    return httpService.get<DashboardTimeseries>("/admin/dashboard/timeseries", {
      query: {
        days: params.days,
        start_date: params.startDate,
        end_date: params.endDate,
        user_id: params.userId,
      },
    });
  }
}

export const dashboardRepository = new DashboardRepository();
