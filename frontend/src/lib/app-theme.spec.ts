import { beforeEach, describe, expect, it, vi } from "vitest";
import { persistAppTheme, readAppTheme, subscribeAppTheme } from "./app-theme";

describe("app theme persistence", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-app-theme");
    document.cookie = "app-theme=; Path=/; Max-Age=0";
  });

  it("keeps DOM, local storage, and the server-readable cookie aligned", () => {
    persistAppTheme("dark");

    expect(document.documentElement).toHaveClass("dark");
    expect(readAppTheme()).toBe("dark");
    expect(document.cookie).toContain("app-theme=dark");

    persistAppTheme("light");

    expect(document.documentElement).not.toHaveClass("dark");
    expect(readAppTheme()).toBe("light");
    expect(document.cookie).toContain("app-theme=light");
  });

  it("preserves the server theme when storage has no preference", () => {
    document.documentElement.classList.add("dark");
    expect(readAppTheme()).toBe("dark");
  });

  it("does not confuse authored public-page colors with the saved app preference", () => {
    persistAppTheme("dark");
    document.documentElement.classList.remove("dark");
    expect(readAppTheme()).toBe("dark");
  });

  it("shares updates and synchronizes other tabs only while subscribed", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAppTheme(listener);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "app-theme", newValue: "dark" }),
    );
    expect(listener).toHaveBeenCalledOnce();
    expect(readAppTheme()).toBe("dark");
    unsubscribe();
    window.dispatchEvent(
      new StorageEvent("storage", { key: "app-theme", newValue: "light" }),
    );
    expect(listener).toHaveBeenCalledOnce();
  });

  it("avoids redundant preference writes", () => {
    const write = vi.spyOn(window.localStorage, "setItem");
    persistAppTheme("dark");
    persistAppTheme("dark");
    expect(write).toHaveBeenCalledOnce();
  });

  it("still changes and remembers the theme when local storage is blocked", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    persistAppTheme("dark");
    expect(readAppTheme()).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.cookie).toContain("app-theme=dark");
  });
});
