import type { DashboardStats, DashboardTimeseries } from "@/lib/types";

export interface IDashboardRepository {
  stats(): Promise<DashboardStats>;
  timeseries(days: number): Promise<DashboardTimeseries>;
}
