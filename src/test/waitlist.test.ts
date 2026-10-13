import { beforeEach, describe, expect, it } from "vitest";

import { storedEntries, submitWaitlist } from "@/lib/waitlist";

const EMAIL = "early@example.com";

describe("waitlist capture", () => {
  beforeEach(() => {
    window.localStorage.removeItem("likha.waitlist");
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
