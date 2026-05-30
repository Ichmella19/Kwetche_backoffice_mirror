"use client";

/**
 * Hooks réutilisables. Les hooks d'état global (auth, theme, toast) sont
 * réexportés depuis leurs contextes pour un import unique.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/utils/helpers";
import {
  realtimeService,
  type RealtimeEvent,
  type RealtimeMessage,
} from "@/presentation/services/realtime";

export { useAuth } from "@/presentation/contexts/auth-context";
export { useTheme } from "@/presentation/contexts/theme-context";
export { useToast } from "@/presentation/contexts/toast-context";

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Exécute une promesse et expose son état. `execute` est stable et relance
 * l'appel à la demande (refetch).
 *
 * IMPORTANT : `factory` est utilisé comme dépendance de l'effet de fetch.
 * Pour que les filtres / paramètres déclenchent un refetch, **wrappe ta
 * factory dans `useCallback`** avec les bonnes deps. Sinon une factory
 * inline sera recréée à chaque render et boucle infinie.
 */
export function useAsync<T>(factory: () => Promise<T>, immediate = true) {
  const factoryRef = useRef(factory);
  factoryRef.current = factory;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await factoryRef.current();
      setState({ data, isLoading: false, error: null });
      return data;
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false, error: getErrorMessage(err) }));
      throw err;
    }
  }, []);

  useEffect(() => {
    if (immediate) execute().catch(() => undefined);
    // `factory` fait partie des deps : changer un filtre côté caller
    // (via useCallback avec ses propres deps) déclenche un refetch.
  }, [execute, immediate, factory]);

  return { ...state, execute, setData: (data: T) => setState((s) => ({ ...s, data }) ) };
}

/** Valeur temporisée (utile pour la recherche). */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** État persistant dans localStorage. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = next instanceof Function ? next(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* ignore */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, set] as const;
}

/**
 * Abonne le composant aux events realtime backend. `events` peut être :
 *  - undefined → tous les events reçus
 *  - une liste de noms d'event → seulement ceux-là
 *
 * Le `handler` est appelé à chaque message correspondant. Cas d'usage classique :
 * forcer un `execute()` d'un `useAsync` pour rafraîchir une liste / un détail.
 */
export function useRealtime(
  events: ReadonlyArray<RealtimeEvent | string> | undefined,
  handler: (msg: RealtimeMessage) => void,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const watchedRef = useRef(events);
  watchedRef.current = events;

  useEffect(() => {
    realtimeService.connect();
    const unsub = realtimeService.subscribe((msg) => {
      const watched = watchedRef.current;
      if (watched && !watched.includes(msg.event)) return;
      handlerRef.current(msg);
    });
    return unsub;
  }, []);
}
