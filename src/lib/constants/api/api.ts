export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

/** Racine de l'hôte API (sans `/api`), pour résoudre les fichiers uploadés. */
export const FILE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";
export const API_TIMEOUT = 30_000;
