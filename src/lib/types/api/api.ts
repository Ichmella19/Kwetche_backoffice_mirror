/** Enveloppe standard renvoyée par l'API : `{ message, success, data?, reason? }`. */
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message: string;
  statusCode: number;
  reason?: string;
}

/** Réponse paginée générique (curseur page/total). */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
