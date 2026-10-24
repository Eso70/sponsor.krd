import { DashboardRefreshTestShell } from "@/test-utils/DashboardRefreshTestShell";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlatformLinktreesPage } from "./PlatformLinktreesPage";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";

const apiRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/request", () => ({
  apiRequest: apiRequestMock,
}));

describe("PlatformLinktreesPage loading", () => {
  afterEach(() => apiRequestMock.mockReset());
  it("keeps pages available when summary loading fails and never sums page-level visitors", async () => {
    const errorLog = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    let available = false;
    apiRequestMock.mockImplementation((url: string) => {
      if (url.endsWith("/context"))
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
      if (url.endsWith("/analytics/summary"))
        return Promise.resolve(
          available
            ? {
                total_views: 42,
                unique_views: 9,
                total_clicks: 30,
                unique_clicks: 7,
                insights: { contactActions: 4 },
              }
            : null,
        );
      return Promise.resolve(
        [1, 2].map((id) => ({
          id: `page-${id}`,
          uid: `page-${id}`,
          name: `Page ${id}`,
          created_at: "2026-10-15T00:00:00Z",
          updated_at: "2026-10-15T00:00:00Z",
          analytics: { unique_views: 50, unique_clicks: 20 },
        })),
      );
    });
    render(
      <DashboardRefreshTestShell>
        <PlatformLocaleProvider initialLocale="en">
          <PlatformLinktreesPage />
        </PlatformLocaleProvider>
      </DashboardRefreshTestShell>,
    );
    await waitFor(() => expect(screen.getAllByText("—")).toHaveLength(5));
    const visitors = within(
      screen.getByText("Unique visitors").closest("article")!,
    );
    expect(visitors.getByText("—")).toBeInTheDocument();
    expect(visitors.queryByText("100")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
    available = true;
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() =>
      expect(
        within(
          screen.getByText("Unique visitors").closest("article")!,
        ).getByText("9"),
      ).toBeInTheDocument(),
    );
    errorLog.mockRestore();
  });

  it("does not mount a modal skeleton until a modal is opened", () => {
    apiRequestMock.mockImplementation(() => new Promise(() => undefined));
    render(
      <PlatformLocaleProvider initialLocale="ckb">
        <PlatformLinktreesPage />
      </PlatformLocaleProvider>,
    );

    expect(screen.queryByLabelText("Loading dialog")).not.toBeInTheDocument();
  });

  it("loads the platform-wide totals used by the shared six-card overview", async () => {
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
          insights: { contactActions: 4 },
        });
      }
      return Promise.resolve([]);
    });

    render(
      <PlatformLocaleProvider initialLocale="ckb">
        <PlatformLinktreesPage />
      </PlatformLocaleProvider>,
    );

    await waitFor(() =>
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/platform/linktrees/analytics/summary",
      ),
    );
    expect(await screen.findByText("42")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });

  it("shows Arabic summary and page actions when the administrator prefers Arabic", async () => {
    apiRequestMock.mockImplementation((url: string) => {
      if (url.endsWith("/context"))
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
      if (url.endsWith("/analytics/summary"))
        return Promise.resolve({
          total_views: 42,
          unique_views: 20,
          total_clicks: 10,
          unique_clicks: 7,
          conversions: 3,
          conversion_value: 0,
          insights: { contactActions: 4 },
        });
      return Promise.resolve([]);
    });

    render(
      <PlatformLocaleProvider initialLocale="ar">
        <PlatformLinktreesPage />
      </PlatformLocaleProvider>,
    );
    expect(await screen.findByText("المشاهدات")).toBeInTheDocument();
    expect(
      await screen.findByText(
        "لا توجد صفحات روابط للمنصة بعد",
        {},
        { timeout: 15_000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إنشاء" })).toBeInTheDocument();
  }, 20_000);
});
