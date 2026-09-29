import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlatformLinktreesPage } from "./PlatformLinktreesPage";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";

const apiRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/request", () => ({
  apiRequest: apiRequestMock,
}));

describe("PlatformLinktreesPage loading", () => {
  afterEach(() => apiRequestMock.mockReset());

  it("does not mount a modal skeleton until a modal is opened", () => {
    apiRequestMock.mockImplementation(() => new Promise(() => undefined));
    render(<PlatformLocaleProvider initialLocale="ckb"><PlatformLinktreesPage /></PlatformLocaleProvider>);

    expect(screen.queryByLabelText("Loading dialog")).not.toBeInTheDocument();
  });

  it("loads the platform-wide totals used by the shared six-card manager", async () => {
    apiRequestMock.mockImplementation((url: string) => {
      if (url.endsWith("/context")) {
        return Promise.resolve({
          branding: {
            name: "Sponsor.krd",
            logo: null,
            avatar: null,
            favicon: null,
            accentColor: "#25F4EE",
          },
          publicPathPrefix: "/linktree",
        });
      }
      if (url.endsWith("/analytics/summary")) {
        return Promise.resolve({
          total_views: 42,
          unique_views: 20,
          total_clicks: 10,
          unique_clicks: 7,
          conversions: 3,
          conversion_value: 0,
        });
      }
      return Promise.resolve([]);
    });

    render(<PlatformLocaleProvider initialLocale="ckb"><PlatformLinktreesPage /></PlatformLocaleProvider>);

    await waitFor(() =>
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/platform/linktrees/analytics/summary",
      ),
    );
    expect(await screen.findByText("42")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows Arabic summary and page actions when the administrator prefers Arabic", async () => {
    apiRequestMock.mockImplementation((url: string) => {
      if (url.endsWith("/context")) return Promise.resolve({ branding: { name: "Sponsor.krd", logo: null, avatar: null, favicon: null, accentColor: "#25F4EE" }, publicPathPrefix: "/linktree" });
      if (url.endsWith("/analytics/summary")) return Promise.resolve({ total_views: 42, unique_views: 20, total_clicks: 10, unique_clicks: 7, conversions: 3, conversion_value: 0 });
      return Promise.resolve([]);
    });

    render(<PlatformLocaleProvider initialLocale="ar"><PlatformLinktreesPage /></PlatformLocaleProvider>);
    expect(await screen.findByText("إجمالي صفحات لينكتري")).toBeInTheDocument();
    expect(await screen.findByText("لا توجد صفحات روابط للمنصة بعد", {}, { timeout: 15_000 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /صفحة جديدة/ })).toBeInTheDocument();
  }, 20_000);
});
