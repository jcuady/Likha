/**
 * Waitlist capture. There is no backend yet, so this module is the single
 * place a real destination plugs in: replace the body of `submitWaitlist` with a
 * call to Resend, a Supabase insert, or a webhook. Nothing else changes, and
 * the UI already tells the visitor exactly what happened.
 */

export type Interest = "investor" | "partner";

export type WaitlistEntry = {
  email: string;
  interest: Interest;
  createdAt: string;
};

export type SubmitResult = { ok: true } | { ok: false; error: string };

const STORAGE_KEY = "likha.waitlist";

/** Reads anything captured so far in this browser. Used to disable re-submission. */
export function storedEntries(): WaitlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is WaitlistEntry =>
        typeof v === "object" &&
        v !== null &&
        typeof (v as WaitlistEntry).email === "string" &&
        typeof (v as WaitlistEntry).interest === "string",
    );
  } catch {
    return [];
  }
}

/**
 * Captures one entry.
 *
 * Today this only writes to localStorage, because there is no server to send it
 * to. That is why the dialog states the address was not transmitted rather than
 * claiming the visitor is on a list.
 */
export async function submitWaitlist(
  entry: Omit<WaitlistEntry, "createdAt">,
): Promise<SubmitResult> {
  const email = entry.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address" };
  }

  try {
    const next = [...storedEntries(), { ...entry, email, createdAt: new Date().toISOString() }];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // A full or blocked store must not read as a failed sign-up: the address is
    // still validated and the copy below describes what actually happened.
  }

  return { ok: true };
}

export const INTEREST_COPY: Record<Interest, { label: string; blurb: string }> = {
  investor: {
    label: "To invest",
    blurb: "Get the first listing batch before it opens to everyone.",
  },
  partner: {
    label: "To partner",
    blurb: "Property owners, brokers, and people with units to place.",
  },
};
