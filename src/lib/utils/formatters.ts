/**
 * Formatage des données pour l'affichage (devise XOF, dates FR, fichiers…).
 */

import { FILE_BASE_URL } from "@/lib/constants";

/** Formate un montant en Franc CFA (XOF) sans décimales. */
export const formatCurrency = (amount: number, currency = "XOF"): string =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

/** Formate un nombre avec séparateurs de milliers. */
export const formatNumber = (value: number): string =>
  new Intl.NumberFormat("fr-FR").format(value);

const toDate = (date: string | Date | null | undefined): Date | null => {
  if (!date) return null;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Date longue : « 21 mai 2026 ». */
export const formatDate = (date: string | Date | null | undefined): string => {
  const d = toDate(date);
  if (!d) return "—";
  return d.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/** Date + heure : « 21 mai 2026, 14:05 ». */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  const d = toDate(date);
  if (!d) return "—";
  return d.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Date relative : « il y a 3 min », « il y a 2 j ». */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
  const d = toDate(date);
  if (!d) return "—";
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hour = Math.round(min / 60);
  const day = Math.round(hour / 24);

  if (sec < 60) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  if (hour < 24) return `il y a ${hour} h`;
  if (day < 30) return `il y a ${day} j`;
  return formatDate(d);
};

/** Numéro complet « +229 01 02 03 04 » à partir de l'indicatif + numéro. */
export const formatPhone = (
  phone: string | null | undefined,
  countryCode?: string | null,
): string => {
  if (!phone) return "—";
  const prefix = countryCode ? `${countryCode} ` : "";
  return `${prefix}${phone}`.trim();
};

export const fullName = (
  first?: string | null,
  last?: string | null,
): string => [first, last].filter(Boolean).join(" ").trim() || "—";

export const getInitials = (
  first?: string | null,
  last?: string | null,
): string => {
  const a = first?.trim().charAt(0) ?? "";
  const b = last?.trim().charAt(0) ?? "";
  return (a + b).toUpperCase() || "?";
};

/**
 * Résout l'URL d'un fichier servi par l'API.
 * Accepte une URL absolue (renvoyée telle quelle) ou un chemin relatif
 * (préfixé par l'hôte de l'API).
 */
export const resolveFileUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${FILE_BASE_URL}${clean}`;
};

/** Taille de fichier lisible : « 10 Mo ». */
export const formatBytes = (bytes: number): string => {
  if (!bytes) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export const truncate = (text: string, length = 50): string =>
  text.length > length ? `${text.slice(0, length)}…` : text;

export const capitalize = (str: string): string =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
