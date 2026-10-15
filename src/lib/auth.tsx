import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Role = "investor" | "admin";

export type Session = {
  name: string;
  email: string;
  role: Role;
  /** Persona label shown on the sign-in cards. */
  persona: string;
};

export type Persona = {
  id: string;
  label: string;
  blurb: string;
  initials: string;
  session: Session;
};

const STORAGE_KEY = "likha.session";
/**
 * Two stores, one key. `remember: false` means the session should not outlive
 * the tab, which in a browser-only build is the only honest translation of
 * "keep me signed in": localStorage survives a browser restart, sessionStorage
 * does not. The checkbox used to be registered, validated and rendered, and
 * then never read, so unchecking it changed nothing.
 *
 * Resolved through a function rather than a module constant: this module is
 * evaluated during SSR, where `window` does not exist, and touching it at
 * import time made every route return a 500.
 */
const stores = (): Storage[] =>
  typeof window === "undefined" ? [] : [window.localStorage, window.sessionStorage];

/**
 * Demo personas. The sign-in page renders these as one-click cards so the app
 * can be explored without credentials. A real auth provider replaces this map
 * and nothing else in the UI has to change.
 */
export const personas: Persona[] = [
  {
    id: "investor",
    label: "Investor",
    blurb: "Browse listings, hold shares, track income",
    initials: "AR",
    session: {
      name: "Andrea Reyes",
      email: "andrea@example.com",
      role: "investor",
      persona: "Investor",
    },
  },
  {
    id: "investor-new",
    label: "New investor",
    blurb: "Empty portfolio, first-run state",
    initials: "JL",
    session: {
      name: "Jomar Locsin",
      email: "jomar@example.com",
      role: "investor",
      persona: "New investor",
    },
  },
  {
    id: "admin",
    label: "Administrator",
    blurb: "Listings, investors, analytics, approvals",
    initials: "MC",
    session: {
      name: "Marisol Cruz",
      email: "admin@likha.ph",
      role: "admin",
      persona: "Administrator",
    },
  },
];

type AuthContextValue = {
  session: Session | null;
  signIn: (session: Session, remember?: boolean) => void;
  signInAs: (personaId: string, remember?: boolean) => void;
  signOut: () => void;
  ready: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStored(): Session | null {
  if (typeof window === "undefined") return null;
  for (const store of stores()) {
    try {
      const raw = store.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Session;
    } catch {
      // A store that throws (private browsing, disabled storage) is skipped
      // rather than fatal: the other one may still hold a usable session.
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // Hydration-safe: server render starts signed out, then the stored session
  // is applied on mount so SSR markup never differs from a signed-in client.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readStored());
    setReady(true);
  }, []);

  const signIn = useCallback((next: Session, remember = true) => {
    setSession(next);
    // Clear both first so flipping the checkbox cannot leave a stale copy in
    // the store the user just declined to use.
    for (const store of stores()) {
      try {
        store.removeItem(STORAGE_KEY);
      } catch {
        // Nothing to clear if the write never succeeded.
      }
    }
    try {
      const target = remember ? window.localStorage : window.sessionStorage;
      target.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private browsing can reject writes; the in-memory session still works.
    }
  }, []);

  const signInAs = useCallback(
    (personaId: string, remember = true) => {
      const persona = personas.find((p) => p.id === personaId);
      if (persona) signIn(persona.session, remember);
    },
    [signIn],
  );

  const signOut = useCallback(() => {
    setSession(null);
    for (const store of stores()) {
      try {
        store.removeItem(STORAGE_KEY);
      } catch {
        // Ignore: nothing to clean up if the write never succeeded.
      }
    }
  }, []);

  const value = useMemo(
    () => ({ session, signIn, signInAs, signOut, ready }),
    [session, signIn, signInAs, signOut, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
