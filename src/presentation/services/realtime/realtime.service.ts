/**
 * Service realtime BO : WebSocket vers `/api/realtime` du backend, abonné
 * automatiquement au channel `admin` (events globaux staff : nouveaux dossiers
 * KYC, recouvrement, tx wallet en attente, etc.). Heartbeat + reconnect.
 *
 * Tolérance aux défaillances :
 *  - Recule exponentiellement (1 → 30 s) tant qu'il y a échec
 *  - **Abandonne après `MAX_RECONNECT_ATTEMPTS`** échecs consécutifs (évite le
 *    spam console quand le reverse-proxy ne forward pas l'upgrade WS)
 *  - Reset le compteur uniquement quand le serveur a renvoyé l'event
 *    `connected` (auth OK), pas juste sur `onopen` (qui passe même quand
 *    la close survient juste après le handshake TCP)
 *  - Une nouvelle navigation / appel manuel à `connect()` réinitialise tout
 */

import { API_BASE_URL, STORAGE_KEYS } from "@/lib/constants";

const MAX_RECONNECT_ATTEMPTS = 6;

export type RealtimeEvent =
  | "connected"
  | "ping"
  | "pong"
  | "user.updated"
  | "kyc.identity.submitted"
  | "kyc.identity.reviewed"
  | "kyc.document.submitted"
  | "kyc.document.reviewed"
  | "kyc.document.requested"
  | "kyc.level.changed"
  | "wallet.updated"
  | "wallet.transaction.updated"
  | "tontine.updated"
  | "tontine.contribution.due"
  | "tontine.payout.received"
  | "debt.reminder"
  | "recouvrement.case.assigned"
  | "session.revoked"
  | "notification.created";

export interface RealtimeMessage {
  channel: string;
  event: RealtimeEvent | string;
  data: Record<string, unknown>;
}

type Listener = (msg: RealtimeMessage) => void;

class BoRealtimeService {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private explicitlyClosed = false;
  /** Devient `true` quand le serveur a renvoyé `event: connected` (= auth OK). */
  private serverHandshakeOk = false;
  /** `true` si on a abandonné après trop d'échecs (jusqu'à un appel manuel). */
  private givenUp = false;

  /** Construit `ws://...host/api/realtime` à partir de `API_BASE_URL`. */
  private wsUrl(): string | null {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return null;
    const base = API_BASE_URL.replace(/^http/, "ws");
    return `${base}/realtime?token=${encodeURIComponent(token)}`;
  }

  connect(): void {
    if (typeof window === "undefined") return;
    if (this.ws && this.ws.readyState <= 1) return; // déjà connecté/connectant
    // Reset si on a abandonné (appel manuel = nouvelle intention de connecter).
    if (this.givenUp) {
      this.givenUp = false;
      this.reconnectAttempt = 0;
    }
    const url = this.wsUrl();
    if (!url) return; // pas de token = pas de connexion

    this.explicitlyClosed = false;
    this.serverHandshakeOk = false;
    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws.onopen = () => {
      this.startHeartbeat();
      // On NE reset PAS reconnectAttempt ici : le handshake TCP réussit même
      // sur un endpoint qui refuse l'upgrade WS (proxy mal configuré).
      // On attend le premier message du serveur (event `connected`) pour
      // considérer la connexion comme vraiment fonctionnelle.
    };
    this.ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as RealtimeMessage;
        if (msg.event === "connected" && !this.serverHandshakeOk) {
          this.serverHandshakeOk = true;
          this.reconnectAttempt = 0;
        }
        for (const l of this.listeners) {
          try {
            l(msg);
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* invalid frame */
      }
    };
    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.ws = null;
      if (!this.explicitlyClosed) this.scheduleReconnect();
    };
    this.ws.onerror = () => {
      // onclose se charge de la reconnexion. Pas de console.error :
      // le browser logge déjà l'échec de handshake côté Network.
    };
  }

  disconnect(): void {
    this.explicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ event: "ping" }));
        } catch {
          /* ignore */
        }
      }
    }, 25_000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.explicitlyClosed) return;
    this.reconnectAttempt += 1;
    if (this.reconnectAttempt > MAX_RECONNECT_ATTEMPTS) {
      // Endpoint probablement cassé (proxy WS non configuré ou backend down).
      // On arrête le spam de tentatives jusqu'à un nouvel appel manuel à
      // `connect()` (ex. nouvelle navigation).
      this.givenUp = true;
      if (typeof console !== "undefined" && console.warn) {
        console.warn(
          "[realtime] connection failed after %d attempts — giving up. " +
            "Check that the backend WebSocket endpoint is reachable through " +
            "the reverse-proxy (Upgrade + Connection headers must be forwarded).",
          MAX_RECONNECT_ATTEMPTS,
        );
      }
      return;
    }
    const delay = Math.min(1000 * 2 ** (this.reconnectAttempt - 1), 30_000);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
}

export const realtimeService = new BoRealtimeService();
