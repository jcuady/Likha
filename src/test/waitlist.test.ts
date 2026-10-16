import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DELIVERY_COPY, storedEntries, submitWaitlist, webhookUrl } from "@/lib/waitlist";

const EMAIL = "early@example.com";
const ENDPOINT = "https://script.google.com/macros/s/FAKE/exec";

describe("waitlist capture", () => {
  beforeEach(() => {
    window.localStorage.removeItem("likha.waitlist");
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rejects an address that is not an email", async () => {
    const result = await submitWaitlist({ email: "not-an-email", interest: "investor" });
    expect(result.ok).toBe(false);
    expect(storedEntries()).toHaveLength(0);
  });

  it("stores a normalised entry", async () => {
    const result = await submitWaitlist({ email: "  Early@Example.COM ", interest: "investor" });
    expect(result.ok).toBe(true);
    const entries = storedEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.email).toBe(EMAIL);
    expect(entries[0]?.interest).toBe("investor");
    expect(typeof entries[0]?.createdAt).toBe("string");
  });

  it("keeps a second entry from overwriting the first", async () => {
    await submitWaitlist({ email: EMAIL, interest: "investor" });
    await submitWaitlist({ email: "partner@example.com", interest: "partner" });
    expect(storedEntries().map((e) => e.email)).toEqual([EMAIL, "partner@example.com"]);
  });

  it("returns empty rather than throwing when the store is corrupt", () => {
    window.localStorage.setItem("likha.waitlist", "{not json");
    expect(storedEntries()).toEqual([]);
  });

  it("drops malformed records instead of trusting the shape", () => {
    // A record missing `interest` is not a valid entry, and one with a numeric
    // email is not either. Only the well-formed row may survive.
    window.localStorage.setItem(
      "likha.waitlist",
      JSON.stringify([
        { email: EMAIL },
        { email: 42, interest: "investor", createdAt: "2026-01-01" },
        { email: "good@example.com", interest: "partner", createdAt: "2026-01-01" },
      ]),
    );
    const entries = storedEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.email).toBe("good@example.com");
    expect(entries[0]?.interest).toBe("partner");
  });
});

describe("waitlist confirmation copy", () => {
  // The copy is the only thing standing between the visitor and a false
  // promise, so each outcome is pinned to what it is allowed to say.
  const claims = (s: string) => /on the (early )?list|sent to|we have your interest/i.test(s);

  it("gives every delivery outcome its own title and detail", () => {
    expect(Object.keys(DELIVERY_COPY).sort()).toEqual(["confirmed", "local", "sent"]);
    for (const [key, copy] of Object.entries(DELIVERY_COPY)) {
      expect(copy.title.length, `${key} title`).toBeGreaterThan(0);
      expect(copy.detail.length, `${key} detail`).toBeGreaterThan(0);
    }
  });

  it("never claims transmission when nothing was transmitted", () => {
    const text = `${DELIVERY_COPY.local.title} ${DELIVERY_COPY.local.detail}`;
    expect(claims(text)).toBe(false);
    expect(DELIVERY_COPY.local.detail).toMatch(/not been transmitted/i);
  });

  it("claims transmission only when the webhook answered", () => {
    expect(claims(DELIVERY_COPY.confirmed.detail)).toBe(true);
  });

  it("does not claim confirmation for an unread reply", () => {
    // "sent" is not "confirmed". Saying so is the whole distinction.
    const text = `${DELIVERY_COPY.sent.title} ${DELIVERY_COPY.sent.detail}`;
    expect(text).toMatch(/cannot show you a status/i);
    expect(DELIVERY_COPY.sent.title).not.toMatch(/on the (early )?list/i);
  });

  it("gives each outcome a distinct title", () => {
    const titles = Object.values(DELIVERY_COPY).map((c) => c.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("waitlist destination", () => {
  // Typed so the recorded call arguments keep their shape; an untyped vi.fn()
  // types mock.calls as [] and silently loses the very thing under assertion.
  const okFetch = () =>
    vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve({ ok: true, status: 200 } as Response),
    );

  beforeEach(() => {
    window.localStorage.removeItem("likha.waitlist");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reports no destination when the variable is unset", () => {
    vi.stubEnv("VITE_WAITLIST_WEBHOOK_URL", "");
    expect(webhookUrl()).toBeNull();
  });

  it('treats a blank value as no destination rather than posting to ""', () => {
    vi.stubEnv("VITE_WAITLIST_WEBHOOK_URL", "   ");
    expect(webhookUrl()).toBeNull();
  });

  it("reports local delivery and never calls the network when unconfigured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_WAITLIST_WEBHOOK_URL", "");

    const result = await submitWaitlist({ email: EMAIL, interest: "investor" });

    expect(result).toEqual({ ok: true, delivery: "local" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("confirms delivery when the webhook answers 2xx", async () => {
    vi.stubGlobal("fetch", okFetch());
    vi.stubEnv("VITE_WAITLIST_WEBHOOK_URL", ENDPOINT);

    const result = await submitWaitlist({ email: EMAIL, interest: "investor" });

    expect(result).toEqual({ ok: true, delivery: "confirmed" });
  });

  it("sends as text/plain so the request needs no CORS preflight", async () => {
    // A JSON content type makes the browser preflight, Apps Script does not
    // answer OPTIONS, and the request never leaves the page at all.
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_WAITLIST_WEBHOOK_URL", ENDPOINT);

    await submitWaitlist({ email: EMAIL, interest: "investor" });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.headers).toMatchObject({ "Content-Type": "text/plain;charset=utf-8" });
    expect(init?.mode).toBeUndefined();
    expect(JSON.parse(String(init?.body)).email).toBe(EMAIL);
  });

  it("reports 'sent' when the reply is opaque but the request went out", async () => {
    // Apps Script sends no CORS headers, so the browser rejects a readable
    // fetch even though the sheet already has the row. Falling back to no-cors
    // finds out whether it can be sent, without inflating that to "confirmed".
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_WAITLIST_WEBHOOK_URL", ENDPOINT);

    const result = await submitWaitlist({ email: EMAIL, interest: "investor" });

    expect(result).toEqual({ ok: true, delivery: "sent" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[1]?.[1] as RequestInit).mode).toBe("no-cors");
  });

  it("falls back to local when both attempts fail, and says so", async () => {
    // The dangerous outcome is claiming delivery for a request that never left.
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_WAITLIST_WEBHOOK_URL", ENDPOINT);

    const result = await submitWaitlist({ email: EMAIL, interest: "investor" });

    expect(result).toEqual({ ok: true, delivery: "local" });
  });

  it("treats a non-2xx reply as undelivered rather than success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_WAITLIST_WEBHOOK_URL", ENDPOINT);

    const result = await submitWaitlist({ email: EMAIL, interest: "investor" });

    expect(result.ok && result.delivery).not.toBe("confirmed");
  });

  it("keeps the local copy whatever the network does", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    vi.stubEnv("VITE_WAITLIST_WEBHOOK_URL", ENDPOINT);

    await submitWaitlist({ email: EMAIL, interest: "investor" });

    // A dropped network must not cost the visitor's entry.
    expect(storedEntries().map((e) => e.email)).toEqual([EMAIL]);
  });

  it("does not post an address that failed validation", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_WAITLIST_WEBHOOK_URL", ENDPOINT);

    const result = await submitWaitlist({ email: "nope", interest: "investor" });

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
