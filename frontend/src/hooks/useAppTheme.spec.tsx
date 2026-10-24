import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardAppearanceControls } from "@/components/shared/DashboardAppearanceControls";
import { ThemeToggleButton } from "@/components/shared/ThemeToggleButton";
import { persistAppTheme, readAppTheme } from "@/lib/app-theme";
import { toggleAppTheme } from "@/lib/app-theme-transition";
import { useAppTheme } from "./useAppTheme";

function Dashboard({ surface }: { surface: string }) {
  const { theme, toggleTheme } = useAppTheme();
  return (
    <section aria-label={surface}>
      <DashboardAppearanceControls
        theme={theme}
        mounted
        onToggleTheme={toggleTheme}
        languageControl={null}
      />
    </section>
  );
}

describe("shared app appearance", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    persistAppTheme("light");
  });
  afterEach(() => {
    cleanup();
    vi.runAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete (document as Partial<Document>).startViewTransition;
  });

  it("keeps Business, Platform and standalone controls synchronized", () => {
    render(
      <>
        <Dashboard surface="Business" />
        <Dashboard surface="Platform" />
        <ThemeToggleButton />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Change theme" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(document.querySelectorAll(".lucide-sun")).toHaveLength(3);
    fireEvent.click(screen.getAllByRole("button", { name: "Toggle theme" })[0]);
    expect(document.querySelectorAll(".lucide-moon")).toHaveLength(3);
  });

  it("applies reduced-motion changes immediately without taking snapshots", () => {
    const start = vi.fn();
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: start,
    });
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    toggleAppTheme();
    expect(readAppTheme()).toBe("dark");
    expect(start).not.toHaveBeenCalled();
  });

  it("discards stale callbacks during rapid toggles and cleans up snapshot state", async () => {
    const callbacks: Array<() => void> = [];
    const finishers: Array<() => void> = [];
    const skip = vi.fn();
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: (callback: () => void) => {
        callbacks.push(callback);
        return {
          skipTransition: skip,
          ready: Promise.resolve(),
          finished: new Promise<void>((resolve) => finishers.push(resolve)),
        };
      },
    });
    toggleAppTheme();
    toggleAppTheme();
    await act(async () => {
      callbacks[1]();
      callbacks[0]();
      finishers.forEach((finish) => finish());
    });
    expect(skip).toHaveBeenCalledOnce();
    expect(readAppTheme()).toBe("light");
    expect(document.documentElement).not.toHaveAttribute(
      "data-app-theme-changing",
    );
  });

  it("still applies the requested theme when the browser cannot capture a snapshot", async () => {
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: () => ({
        skipTransition: vi.fn(),
        ready: Promise.reject(new Error("Hidden")),
        finished: Promise.reject(new Error("Hidden")),
      }),
    });
    await act(async () => toggleAppTheme());
    expect(readAppTheme()).toBe("dark");
    expect(document.documentElement).not.toHaveAttribute(
      "data-app-theme-changing",
    );
  });
});
