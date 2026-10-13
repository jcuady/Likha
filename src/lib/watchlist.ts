import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "likha.watchlist";

let ids: string[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Private browsing can reject writes; the in-memory set still works.
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) ids = parsed.filter((v): v is string => typeof v === "string");
  } catch {
    ids = [];
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  hydrate();
  return () => listeners.delete(listener);
}

function snapshot() {
  return ids;
}

/**
 * Saved-listing ids, shared between cards and the watchlist page so a star
 * toggled in one place is already toggled everywhere else. Replaces cleanly with
 * a server call once accounts exist.
 */
export function useWatchlist() {
  const current = useSyncExternalStore(subscribe, snapshot, () => EMPTY);

  const toggle = useCallback((id: string) => {
    ids = ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id];
    persist();
    emit();
  }, []);

  const clear = useCallback(() => {
    ids = [];
    persist();
    emit();
  }, []);

  return {
    ids: current,
    count: current.length,
    has: useCallback((id: string) => current.includes(id), [current]),
    toggle,
    clear,
  };
}

/** Stable empty reference so the server snapshot never changes identity. */
const EMPTY: string[] = [];
