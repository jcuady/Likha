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
  signIn: (session: Session) => void;
  signInAs: (personaId: string) => void;
  signOut: () => void;
  ready: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStored(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
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

  const signIn = useCallback((next: Session) => {
    setSession(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private browsing can reject writes; the in-memory session still works.
    }
  }, []);

  const signInAs = useCallback(
    (personaId: string) => {
      const persona = personas.find((p) => p.id === personaId);
      if (persona) signIn(persona.session);
    },
    [signIn],
  );

  const signOut = useCallback(() => {
    setSession(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore: nothing to clean up if the write never succeeded.
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
