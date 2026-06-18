/**
 * Service realtime BO : WebSocket vers `/api/realtime` du backend.
 *
 * Le backend abonne automatiquement chaque admin connecté à deux channels :
 *  - `user.{user_id}` : ses events personnels
 *  - `admin`           : flux global staff (nouveaux KYC, recouvrement, etc.)
 *
 * Aligné sur le client mobile (`kweche/lib/presentation/services/realtime/`) :
 *  - **Reconnexion infinie** avec backoff exponentiel borné à 30 s, tant qu'une
 *    session valide existe (pas de give-up arbitraire — c'est au callsite de
 *    couper via `disconnect()` au logout / changement d'utilisateur).
 *  - Le compteur de tentatives est reset **uniquement** quand le serveur a
 *    renvoyé l'event `connected` (auth confirmée), pas juste sur `onopen` qui
 *    passe même sur un proxy mal configuré.
 *  - Heartbeat ping toutes les 25 s pour traverser NAT/proxy et détecter les
 *    coupures silencieuses.
 *
 * Écart inévitable vs mobile : le navigateur web ne peut PAS passer de headers
 * custom à WebSocket. On envoie donc le jeton en query string `?token=...` —
 * le backend l'accepte explicitement (`get_query_argument("token")` en
 * fallback du header).
 */

import { API_BASE_URL, STORAGE_KEYS } from "@/lib/constants";

const HEARTBEAT_MS = 25_000;
const MAX_BACKOFF_MS = 30_000;

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
  | "notification.created"
  | "support.ticket.created"
  | "support.ticket.updated";

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
  /** `true` quand le serveur a renvoyé `event: connected` (auth confirmée). */
  private serverHandshakeOk = false;

  /** Construit `ws[s]://<host>/api/realtime?token=...` à partir de `API_BASE_URL`. */
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
    const url = this.wsUrl();
    if (!url) return; // pas de token = pas de connexion (l'AuthGuard rattrapera)

    this.explicitlyClosed = false;
    this.serverHandshakeOk = false;

    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = socket;

    socket.onopen = () => {
      this.startHeartbeat();
      // On NE reset PAS reconnectAttempt ici : le handshake TCP réussit même
      // sur un endpoint qui refuse l'upgrade WS. On attend `connected`.
    };
    socket.onmessage = (evt) => {
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
            /* le listener ne doit pas casser le pipeline */
          }
        }
      } catch {
        /* trame invalide */
      }
    };
    socket.onclose = () => {
      this.stopHeartbeat();
      this.ws = null;
      if (!this.explicitlyClosed) this.scheduleReconnect();
    };
    socket.onerror = () => {
      // `onclose` se charge de la reconnexion. Pas de console.error : le
      // navigateur log déjà l'échec côté Network.
    };
  }

  /** Coupure volontaire (logout / session invalide). Stoppe tout reconnect. */
  disconnect(): void {
    this.explicitlyClosed = true;
    this.reconnectAttempt = 0;
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

  /** Envoie un event au backend (ex. ping applicatif). No-op si pas connecté. */
  send(event: RealtimeEvent | string, data: Record<string, unknown> = {}): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(JSON.stringify({ event, data }));
    } catch {
      /* socket vient peut-être de se fermer : onclose va relancer */
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send("ping");
    }, HEARTBEAT_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Reconnect avec backoff exponentiel borné (1 s → 30 s).
   * Pas de MAX_ATTEMPTS : le mobile non plus n'en met pas. Si la connexion
   * n'aboutit jamais, c'est le callsite (logout / changement de session)
   * qui doit appeler `disconnect()`.
   */
  private scheduleReconnect(): void {
    if (this.explicitlyClosed) return;
    if (this.reconnectTimer) return; // un reconnect est déjà planifié
    this.reconnectAttempt += 1;
    const delay = Math.min(
      1000 * 2 ** (this.reconnectAttempt - 1),
      MAX_BACKOFF_MS,
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

export const realtimeService = new BoRealtimeService();
