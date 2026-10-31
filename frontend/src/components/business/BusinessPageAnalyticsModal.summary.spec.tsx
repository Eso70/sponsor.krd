import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageAnalyticsDrawer } from "@/features/analytics/components/PageAnalyticsDrawer";
import { businessMessages } from "@/features/business/i18n/messages";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("PageAnalyticsDrawer summary mode", () => {
  it.each(["business", "platform-linktree"] as const)(
    "shows question selections from the %s endpoint",
    async (dataSource) => {
      const totals = {
        total_views: 20,
        unique_views: 12,
        total_clicks: 3,
        unique_clicks: 2,
        conversions: 3,
        conversion_value: 0,
        insights: {
          measuredVisits: 0,
          averageActiveSeconds: 0,
          engagedVisits: 0,
          contactActions: 3,
          contactVisitors: 2,
          confirmedOutcomes: 0,
          valuedOutcomes: 0,
          channels: [],
          devices: [],
          revenue: [],
          whatsapp: {
            opened: 5,
            dismissed: 2,
            selected: 3,
            questions: [
              {
                id: "price",
                label: "Price enquiry",
                historical: false,
                clicks: 3,
                uniqueVisitors: 2,
                lastSelectedAt: null,
                links: [{ label: "واتساپ", clicks: 3 }],
              },
            ],
          },
        },
      };
      const fetchMock = vi.fn((url: string) =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ data: url.includes("actions") ? [] : totals }),
        }),
      );
      vi.stubGlobal("fetch", fetchMock);
      render(
        <PageAnalyticsDrawer
          isOpen
          onClose={vi.fn()}
          pageId="page"
          pageName="Example"
          dataSource={dataSource}
          locale="en"
        />,
      );
      fireEvent.click(
        await screen.findByRole("button", { name: "WhatsApp questions · 3" }),
      );
      expect(screen.getByText("Price enquiry")).toBeVisible();
      expect(screen.getByText("100.0%")).toBeVisible();
      expect(screen.queryByText("Links used")).not.toBeInTheDocument();
      expect(screen.queryByText("واتساپ")).not.toBeInTheDocument();
      const prefix =
        dataSource === "business"
          ? "/api/analytics/v2/summary"
          : "/api/platform/linktrees/page/analytics";
      expect(fetchMock.mock.calls.some(([url]) => url.startsWith(prefix))).toBe(
        true,
      );
    },
  );

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(["business", "platform-linktree"] as const)(
    "keeps data and shared header controls when language changes on %s",
    async (dataSource) => {
      const fetchMock = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                total_views: 23,
                unique_views: 12,
                total_clicks: 8,
                unique_clicks: 3,
                conversions: 0,
                conversion_value: 0,
              },
            }),
        }),
      );
      vi.stubGlobal("fetch", fetchMock);
      const props = {
        isOpen: true,
        onClose: vi.fn(),
        pageId: "page",
        pageName: "Example",
        summaryOnly: true,
        dataSource,
        headerControls: <button>Appearance controls</button>,
      };
      const { rerender } = render(
        <PageAnalyticsDrawer {...props} locale="en" />,
      );
      await screen.findByText("12");
      const requests = fetchMock.mock.calls.length;
      rerender(<PageAnalyticsDrawer {...props} locale="ar" />);
      expect(
        screen.getByRole("button", { name: "Appearance controls" }),
      ).toBeVisible();
      expect(screen.getByRole("button", { name: "تحديث" })).toBeVisible();
      expect(screen.getByText("12")).toBeVisible();
      expect(fetchMock).toHaveBeenCalledTimes(requests);
    },
  );

  it("uses Arabic Business copy without changing the shared Platform default", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                total_views: 20,
                unique_views: 12,
                total_clicks: 8,
                unique_clicks: 3,
                conversions: 0,
                conversion_value: 0,
              },
            }),
        }),
      ),
    );

    render(
      <PageAnalyticsDrawer
        isOpen
        onClose={vi.fn()}
        pageId="business-page-id"
        pageName="Example"
        summaryOnly
        copy={businessMessages.ar.PageAnalytics}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "إحصاءات Example" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تحديث" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("الزوار الفريدون")).toBeInTheDocument(),
    );
  });

  it("reuses loading, refresh, and clear controls for a platform summary", async () => {
    const response = (_url?: string, _init?: RequestInit) =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              total_views: 20,
              unique_views: 12,
              total_clicks: 8,
              unique_clicks: 3,
              conversions: 0,
              conversion_value: 0,
            },
          }),
      });
    const fetchMock = vi.fn(response);
    const onAnalyticsCleared = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PageAnalyticsDrawer
        isOpen
        onClose={vi.fn()}
        pageId="platform-page-id"
        pageName="پەڕەی تاقیکردنەوە"
        canClearAnalytics
        summaryOnly
        dataSource="platform-linktree"
        onAnalyticsCleared={onAnalyticsCleared}
        platformTheme
      />,
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog.parentElement).toHaveAttribute(
      "data-platform-admin-theme",
      "true",
    );
    await waitFor(() => {
      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("25.0%")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: "ئاماری وردتر" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "نوێکردنەوە" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "پاککردنەوەی داتاکان" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/دوگمەکان/)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/platform/linktrees/platform-page-id/analytics",
      expect.objectContaining({ credentials: "include", cache: "no-store" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "نوێکردنەوە" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(String(fetchMock.mock.calls[1]?.[0])).toMatch(
      /^\/api\/platform\/linktrees\/platform-page-id\/analytics\?_t=\d+$/,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "پاککردنەوەی داتاکان" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "بەڵێ، پاکی بکەوە" }),
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/platform/linktrees/platform-page-id/analytics",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(onAnalyticsCleared).toHaveBeenCalledOnce();
  });

  it("loads platform button analytics and applies the shared date range", async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: url.includes("/actions")
              ? [
                  {
                    id: "action-1",
                    label: "Website",
                    actionType: "custom",
                    destination: "https://example.com",
                    totalClicks: 5,
                    uniqueClickers: 3,
                    conversions: 1,
                    conversionValue: 2,
                    ctr: 25,
                    recordState: "historical",
                  },
                  {
                    id: "unattributed:platform-page-id",
                    label: "Unattributed interactions",
                    actionType: "custom",
                    destination: null,
                    totalClicks: 3,
                    uniqueClickers: 2,
                    conversions: 0,
                    conversionValue: 0,
                    ctr: 15,
                    recordState: "unattributed",
                  },
                ]
              : {
                  total_views: 20,
                  unique_views: 12,
                  total_clicks: 8,
                  unique_clicks: 3,
                  conversions: 1,
                  conversion_value: 2,
                },
          }),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PageAnalyticsDrawer
        isOpen
        onClose={vi.fn()}
        pageId="platform-page-id"
        pageName="Platform page"
        dataSource="platform-linktree"
      />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/platform/linktrees/platform-page-id/analytics",
        expect.any(Object),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/platform/linktrees/platform-page-id/analytics/actions",
        expect.any(Object),
      );
    });
    expect(await screen.findByText("Website")).toBeInTheDocument();
    expect(screen.getByText("مێژوویی")).toBeInTheDocument();
    expect(screen.getByText("کلیکە دیارینەکراوەکان")).toBeInTheDocument();
    expect(screen.getByText("دیارینەکراو")).toBeInTheDocument();
    expect(
      screen.getByText(/هەموو کلیکە تۆمارکراوەکان دەگرێتەوە/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /٧ ڕۆژ/ }));
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([url]) =>
          String(url).match(
            /^\/api\/platform\/linktrees\/platform-page-id\/analytics\/actions\?from=\d{4}-\d{2}-\d{2}$/,
          ),
        ),
      ).toBe(true),
    );
  });
});
