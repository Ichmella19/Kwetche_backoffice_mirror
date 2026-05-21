/**
 * Identité de l'appareil — requise par l'API à chaque connexion pour tracer
 * la session back-office. L'ID est généré une fois puis persistant.
 */

import { APP_VERSION, STORAGE_KEYS } from "@/lib/constants";
import type { DeviceInfo } from "@/lib/types";

const randomId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `bo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getDeviceId = (): string => {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!id) {
    id = randomId();
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
  }
  return id;
};

/** Nom lisible de l'appareil/navigateur, dérivé du user-agent. */
export const getDeviceName = (): string => {
  if (typeof navigator === "undefined") return "Back-office Kwetche";
  const ua = navigator.userAgent;
  const browser =
    /Edg\//.test(ua) ? "Edge"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Safari\//.test(ua) ? "Safari"
    : "Navigateur";
  const os =
    /Windows/.test(ua) ? "Windows"
    : /Mac OS/.test(ua) ? "macOS"
    : /Linux/.test(ua) ? "Linux"
    : /Android/.test(ua) ? "Android"
    : /iPhone|iPad/.test(ua) ? "iOS"
    : "—";
  return `${browser} · ${os} · BO Kwetche`;
};

export const getDeviceInfo = (): DeviceInfo => ({
  device_id: getDeviceId(),
  device_name: getDeviceName(),
  app_version: APP_VERSION,
});
