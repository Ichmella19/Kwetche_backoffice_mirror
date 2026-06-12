import type {
  DashboardStats,
  DashboardTimeseries,
  InboxResponse,
} from "@/lib/types";

export interface AnalyticsRangeParams {
  days?: number;
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export interface IDashboardRepository {
  stats(): Promise<DashboardStats>;
  timeseries(params?: AnalyticsRangeParams): Promise<DashboardTimeseries>;
  inbox(limitPerCategory?: number): Promise<InboxResponse>;
}
