export enum AnalyticsPeriod {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
  CUSTOM = "custom",
}

export const ANALYTICS_PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  [AnalyticsPeriod.DAY]: "Jour",
  [AnalyticsPeriod.WEEK]: "Semaine",
  [AnalyticsPeriod.MONTH]: "Mois",
  [AnalyticsPeriod.YEAR]: "Année",
  [AnalyticsPeriod.CUSTOM]: "Date personnalisée",
};

export const ANALYTICS_PERIOD_DAYS: Record<
  Exclude<AnalyticsPeriod, AnalyticsPeriod.CUSTOM>,
  number
> = {
  [AnalyticsPeriod.DAY]: 1,
  [AnalyticsPeriod.WEEK]: 7,
  [AnalyticsPeriod.MONTH]: 30,
  [AnalyticsPeriod.YEAR]: 365,
};
