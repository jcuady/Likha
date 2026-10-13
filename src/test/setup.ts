import "@testing-library/jest-dom/vitest";

/**
 * jsdom in this project exposes `window.localStorage` without the Storage
 * methods, so every module that persists to it (session, watchlist, waitlist)
 * was untestable. A minimal in-memory implementation makes those paths real
 * subjects rather than code only exercised by hand.
 */
function createStorage(): Storage {
  let map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => {
      map = new Map();
    },
  } as Storage;
}

Object.defineProperty(window, "localStorage", {
  writable: true,
  configurable: true,
  value: createStorage(),
});

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
