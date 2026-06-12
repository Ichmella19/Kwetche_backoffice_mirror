/**
 * Client HTTP du back-office Kwetche.
 *
 * Couche `data` : seule responsable de parler à l'API. Repose sur `fetch`
 * (pas de dépendance lourde), comprend l'enveloppe standard de l'API
 * `{ message, success, data?, reason? }` et lève une `ApiError` typée en cas
 * d'échec. Le jeton est conservé en mémoire + localStorage.
 */

import { API_BASE_URL, STORAGE_KEYS } from "@/lib/constants";
import type { ApiResponse } from "@/lib/types";

/** Erreur métier portée par une réponse API non `success`. */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly reason?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  body?: unknown;
  query?: Record<string, QueryValue>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Désactive l'ajout automatique du jeton (endpoints publics). */
  anonymous?: boolean;
}

class HttpService {
  private readonly baseUrl: string;
  private token: string | null = null;
  private onUnauthorized: (() => void) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    }
  }

  // ── Jeton ──────────────────────────────────────────────────────────────
  setToken(token: string): void {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }
  }

  clearToken(): void {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    }
    return this.token;
  }

  /** Branche le contexte d'auth pour réagir aux 401 (déconnexion + redirection). */
  setUnauthorizedHandler(handler: (() => void) | null): void {
    this.onUnauthorized = handler;
  }

  // ── Bas niveau ─────────────────────────────────────────────────────────
  private buildUrl(path: string, query?: RequestOptions["query"]): string {
    const url = new URL(
      `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`,
    );
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === "") continue;
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  async send<T>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.headers ?? {}),
    };

    if (!options.anonymous) {
      const token = this.getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    let body: BodyInit | undefined;
    if (options.body !== undefined && options.body !== null) {
      if (options.body instanceof FormData) {
        body = options.body;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(options.body);
      }
    }

    let response: Response;
    try {
      response = await fetch(this.buildUrl(path, options.query), {
        method,
        headers,
        body,
        signal: options.signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      throw new ApiError(0, "Impossible de joindre le serveur. Vérifiez votre connexion.");
    }

    const statusCode = response.status;
    let payload: Record<string, unknown> = {};
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { message: text };
      }
    }

    const success = response.ok && payload.success !== false;
    const message = (payload.message as string) ?? response.statusText;
    const reason = payload.reason as string | undefined;

    if (statusCode === 401 && !options.anonymous) {
      this.onUnauthorized?.();
    }

    return {
      data: payload.data as T,
      success,
      message,
      statusCode,
      reason,
    };
  }

  /** Renvoie `data` ou lève une `ApiError`. */
  private async unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
    const res = await promise;
    if (!res.success) throw new ApiError(res.statusCode, res.message, res.reason);
    return res.data;
  }

  // ── Helpers typés ──────────────────────────────────────────────────────
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.unwrap(this.send<T>("GET", path, options));
  }
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.unwrap(this.send<T>("POST", path, { ...options, body }));
  }
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.unwrap(this.send<T>("PUT", path, { ...options, body }));
  }
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.unwrap(this.send<T>("PATCH", path, { ...options, body }));
  }
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.unwrap(this.send<T>("DELETE", path, options));
  }

  /**
   * Télécharge un fichier (CSV, PDF…) côté navigateur en conservant le
   * jeton d'auth. Récupère le blob via `fetch` puis déclenche le download.
   * Le nom de fichier est déduit du `Content-Disposition` ou de `fallbackName`.
   */
  async download(
    path: string,
    fallbackName: string,
    options: RequestOptions = {},
  ): Promise<void> {
    const headers: Record<string, string> = { ...(options.headers ?? {}) };
    if (!options.anonymous) {
      const token = this.getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(this.buildUrl(path, options.query), {
      method: "GET",
      headers,
      signal: options.signal,
    });

    if (response.status === 401 && !options.anonymous) {
      this.onUnauthorized?.();
    }
    if (!response.ok) {
      throw new ApiError(response.status, "Échec du téléchargement.");
    }

    const disposition = response.headers.get("Content-Disposition") ?? "";
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const filename = match?.[1] ?? fallbackName;

    const blob = await response.blob();
    if (typeof window !== "undefined") {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
  }
}

export const httpService = new HttpService(API_BASE_URL);
