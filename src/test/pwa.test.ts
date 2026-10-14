import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SITE } from "@/lib/site";

/**
 * PWA install surface. A manifest that is valid JSON but not installable is
 * the failure mode here: Chrome requires 192 and 512 icons, `start_url`, a
 * `display` mode, and a reachable `name`. None of that is covered by
 * typecheck, tests elsewhere, lint or the build, so it is asserted against the
 * files that ship rather than against the manifest's own source text.
 */

const root = join(process.cwd(), "public");
const read = (file: string) => readFileSync(join(root, file), "utf8");

interface Manifest {
  name: string;
  short_name: string;
  start_url: string;
  scope: string;
  display: string;
  theme_color: string;
  background_color: string;
  icons: { src: string; sizes: string; type: string; purpose?: string }[];
}

const manifest = JSON.parse(read("manifest.webmanifest")) as Manifest;

/** PNG signature, then width/height straight out of the IHDR chunk. */
function pngSize(file: string): { w: number; h: number; bytes: number } {
  const buf = readFileSync(join(root, file));
  expect(
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    `${file} is not a PNG`,
  ).toBe(true);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), bytes: buf.length };
}

describe("pwa manifest", () => {
  it("is valid JSON with the fields Chrome requires to offer an install", () => {
    expect(typeof manifest.name).toBe("string");
    expect(manifest.name.length).toBeGreaterThan(0);
    expect(manifest.short_name.length).toBeGreaterThan(0);
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
  });

  it("declares both required icon sizes plus a maskable icon", () => {
    const sizes = manifest.icons.map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect(
      manifest.icons.some((i) => i.purpose?.split(/\s+/).includes("maskable")),
      "no maskable icon: Android will letterbox the ordinary icon on launch",
    ).toBe(true);
  });

  it("points at icon files that exist and are non-empty", () => {
    for (const icon of manifest.icons) {
      const path = join(root, icon.src.replace(/^\//, ""));
      expect(existsSync(path), `${icon.src} is referenced but missing`).toBe(true);
      expect(statSync(path).size).toBeGreaterThan(0);
    }
  });

  it("ships icons at the pixel size the manifest claims", () => {
    for (const icon of manifest.icons) {
      const [w, h] = icon.sizes.split("x").map(Number);
      const actual = pngSize(icon.src.replace(/^\//, ""));
      expect(actual.w, `${icon.src} is not ${w} wide`).toBe(w);
      expect(actual.h, `${icon.src} is not ${h} tall`).toBe(h);
    }
    // iOS picks this up from <link rel="apple-touch-icon">, never the manifest.
    expect(pngSize("apple-touch-icon.png")).toMatchObject({ w: 180, h: 180 });
  });

  it("keeps theme and background colour in sync with SITE", () => {
    expect(manifest.theme_color).toBe(SITE.themeColor);
    expect(manifest.background_color).toBe(SITE.backgroundColor);
    expect(manifest.short_name).toBe(SITE.shortName);
    expect(SITE.themeColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("points every shortcut at a real route", () => {
    const shortcuts = (manifest as unknown as { shortcuts?: { url: string }[] }).shortcuts ?? [];
    for (const s of shortcuts) expect(s.url.startsWith("/")).toBe(true);
    expect(shortcuts.map((s) => s.url)).toContain("/marketplace");
  });
});

describe("root head pwa metadata", () => {
  const rootRoute = readFileSync(join(process.cwd(), "src/routes/__root.tsx"), "utf8");

  it("links the manifest and the iOS touch icon", () => {
    expect(rootRoute).toContain('rel: "manifest"');
    expect(rootRoute).toContain('rel: "apple-touch-icon"');
  });

  it("declares theme-color and iOS standalone capability in meta", () => {
    expect(rootRoute).toContain('name: "theme-color"');
    expect(rootRoute).toContain('name: "apple-mobile-web-app-capable"');
    expect(rootRoute).toContain('name: "apple-mobile-web-app-title"');
  });

  it("does not re-add a root fallback canonical", () => {
    // Regression guard: TanStack dedupes <meta> but appends <link>, so a root
    // canonical stacks with every route's own and collapses the site onto "/".
    expect(rootRoute).not.toMatch(/rel:\s*"canonical"/);
  });
});
