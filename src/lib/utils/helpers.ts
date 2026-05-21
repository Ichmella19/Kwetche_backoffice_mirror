/**
 * Utilitaires communs.
 */

import { ApiError } from "@/core/data/http.service";

/** Message lisible à partir d'une erreur inconnue (ApiError, Error, string…). */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Une erreur est survenue. Veuillez réessayer.";
};

/** Petite pause asynchrone. */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
