import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { PlatformFormsPage } from "./PlatformFormsPage";
import { formsApi } from "@/features/forms/api";
vi.mock("../i18n/PlatformLocaleProvider", () => ({
  usePlatformLocale: () => ({ locale: "en" }),
}));
vi.mock("./PlatformLanguageSelector", () => ({
  PlatformLanguageSelector: () => null,
}));
vi.mock("@/features/forms/api", () => ({
  formsApi: {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    stats: vi
      .fn()
      .mockResolvedValue({ views: 0, visitors: 0, starts: 0, submissions: 0 }),
  },
}));
it("mounts the shared Forms workspace with platform API ownership", async () => {
  const toggle = vi.fn();
  render(<PlatformFormsPage theme="light" mounted onToggleTheme={toggle} />);
  expect(screen.getByRole("heading", { name: "Forms" })).toBeInTheDocument();
  await waitFor(() =>
    expect(formsApi.list).toHaveBeenCalledWith(
      "platform",
      0,
      "",
      "active",
      expect.any(AbortSignal),
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Create form" }));
  fireEvent.click(screen.getByRole("button", { name: "Appearance" }));
  expect(toggle).toHaveBeenCalledOnce();
  expect(formsApi.stats).toHaveBeenCalledWith(
    "platform",
    expect.any(AbortSignal),
  );
});
