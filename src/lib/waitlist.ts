/**
 * Waitlist capture.
 *
 * A destination is optional and configured with VITE_WAITLIST_WEBHOOK_URL. Point
 * it at a Google Apps Script web app (`/exec` endpoint) and addresses are
 * appended to a Sheet; leave it unset and the module keeps its original
 * behaviour of storing the address in this browser only.
 *
 * The copy in the dialog is derived from `delivery`, never assumed. That is the
 * whole point of this module: the three outcomes below are genuinely different,
 * and the visitor is told which one actually happened.
 */

export type Interest = "investor" | "partner";

export type WaitlistEntry = {
  email: string;
  interest: Interest;
  createdAt: string;
};

/**
 * What actually happened to the address.
 *
 * - `confirmed` — the webhook answered 2xx and we read the reply.
 * - `sent`      — the request left the browser but the reply was opaque, so the
 *                 sheet may or may not have the row. Typical for Apps Script,
 *                 which does not send CORS headers on `/exec`.
 * - `local`     — nothing was transmitted. Either no webhook is configured or
 *                 the request failed outright.
 */
export type Delivery = "confirmed" | "sent" | "local";

export type SubmitResult = { ok: true; delivery: Delivery } | { ok: false; error: string };

/**
 * The confirmation shown for each delivery.
 *
 * This lives beside `Delivery` rather than in the dialog so the pairing is
 * testable: for `local` the copy must not claim transmission anywhere, and for
 * `confirmed` it must. Keeping it in a component file would have made the
 * guard impossible to write without tripping the react-refresh lint rule.
 */
export const DELIVERY_COPY: Record<Delivery, { title: string; detail: string }> = {
  confirmed: {
    title: "You are on the early list",
    detail: "Sent to the Likha early list. Nothing is charged and no account was created.",
  },
  sent: {
    title: "Address sent",
    detail:
      "Your browser sent this to the Likha early list but blocked the reply, so we cannot show you a status. Nothing is charged and no account was created.",
  },
  local: {
    title: "Saved in this browser",
    detail:
      "Likha is a preview build with no list connected, so this address has not been transmitted anywhere. Nothing is charged and no account was created.",
  },
};

const STORAGE_KEY = "likha.waitlist";

/**
 * Read lazily, never at module scope.
 *
 * A module-scope read of a browser global evaluated during SSR and returned
 * HTTP 500 on every route in an earlier build. The same rule applies here.
 */
export function webhookUrl(): string | null {
  const raw =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_WAITLIST_WEBHOOK_URL as string | undefined)
      : undefined;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

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

function persist(entry: WaitlistEntry): void {
  try {
    const next = [...storedEntries(), entry];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // A full or blocked store must not read as a failed sign-up: the address is
    // still validated and the copy below describes what actually happened.
  }
}

/**
 * Posts one entry to the webhook.
 *
 * `text/plain` is deliberate. An `application/json` body makes the browser send
 * a CORS preflight, which Apps Script does not answer, so the request would
 * never leave the page at all. Sent as text/plain it is a CORS-safelisted
 * simple request and is delivered.
 *
 * The second attempt is safe to make twice: the Apps Script side upserts on
 * email, so a retry updates one row rather than appending a duplicate.
 */
async function postToWebhook(
  url: string,
  entry: WaitlistEntry,
): Promise<Exclude<Delivery, "local"> | null> {
  const body = JSON.stringify({
    email: entry.email,
    interest: entry.interest,
    createdAt: entry.createdAt,
    source: "likha-landing",
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
    });
    if (res.ok) return "confirmed";
  } catch {
    // No CORS headers on the reply. The request may well have been delivered;
    // fall through and retry opaquely to find out whether it can be sent at all.
  }

  try {
    await fetch(url, { method: "POST", mode: "no-cors", body });
    return "sent";
  } catch {
    return null;
  }
}

/**
 * Captures one entry.
 *
 * The local write always happens, so the address is never lost. What varies is
 * `delivery`, which is what the dialog turns into copy.
 */
export async function submitWaitlist(
  entry: Omit<WaitlistEntry, "createdAt">,
): Promise<SubmitResult> {
  const email = entry.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address" };
  }

  const record: WaitlistEntry = { ...entry, email, createdAt: new Date().toISOString() };
  persist(record);

  const url = webhookUrl();
  if (!url) return { ok: true, delivery: "local" };

  const delivery = await postToWebhook(url, record);
  return { ok: true, delivery: delivery ?? "local" };
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
