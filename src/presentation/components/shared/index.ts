/**
 * Barrel des composants partagés (transverses aux pages).
 */

export { Loading, Spinner } from "./loading";
export type { LoadingProps, SpinnerProps } from "./loading";

export { ErrorState } from "./error";
export type { ErrorStateProps } from "./error";

export { PageHeader } from "./page-header";
export { StatCard } from "./stat-card";
export { EmptyState } from "./empty-state";
export { Pagination } from "./pagination";
export { ConfirmDialog } from "./confirm-dialog";
export { Sparkline } from "./sparkline";
export { AdvancedFilters } from "./advanced-filters";
export type {
  FilterField,
  FilterOption,
  FilterValues,
} from "./advanced-filters";
