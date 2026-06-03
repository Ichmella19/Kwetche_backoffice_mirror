import type { DashboardStats, DashboardTimeseries } from "@/lib/types";

export interface AnalyticsRangeParams {
  days?: number;
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export interface IDashboardRepository {
  stats(): Promise<DashboardStats>;
  timeseries(params?: AnalyticsRangeParams): Promise<DashboardTimeseries>;
}
