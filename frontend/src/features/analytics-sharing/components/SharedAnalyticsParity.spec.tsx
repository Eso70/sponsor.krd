import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  PageAnalyticsTotals,
  PageAnalyticsAction,
  SharedPageAnalytics,
  FormAnalytics,
} from "@linktree/types";
import { PageAnalyticsDrawer } from "@/features/analytics/components/PageAnalyticsDrawer";
import { PageAnalyticsRange } from "@/features/analytics/components/PageAnalyticsRange";
import { pageAnalyticsCopy } from "@/features/analytics/page-analytics-copy";
import { analyticsInsightsCopy } from "@/features/analytics/analytics-insights-copy";
import { FormAnalyticsOverview } from "@/features/forms/components/FormAnalyticsOverview";
import { formsCopy } from "@/features/forms/forms-copy";
import { SharedAnalyticsReport } from "./SharedAnalyticsReport";
import { SharedAnalyticsPage } from "./SharedAnalyticsPage";

const request = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/request", async (original) => ({
  ...(await original<typeof import("@/lib/api/request")>()),
  apiRequest: request,
}));
const totals: PageAnalyticsTotals = {
  total_views: 131,
  unique_views: 97,
  total_clicks: 63,
  unique_clicks: 41,
  conversions: 15,
  conversion_value: 0,
  insights: {
    measuredVisits: 50,
    averageActiveSeconds: 37,
    engagedVisits: 23,
    contactActions: 15,
    contactVisitors: 12,
    confirmedOutcomes: 2,
    valuedOutcomes: 1,
    channels: [{ name: "search", views: 9 }],
    devices: [{ name: "mobile", views: 11 }],
    revenue: [{ currency: "IQD", value: 1500 }],
    whatsapp: {
      opened: 8,
      dismissed: 3,
      selected: 5,
      questions: [
        {
          id: "q1",
          label: "Price enquiry",
          clicks: 5,
          uniqueVisitors: 4,
          historical: false,
          lastSelectedAt: null,
          links: [{ label: "Sales", clicks: 5 }],
        },
      ],
    },
  },
};
const actions: PageAnalyticsAction[] = [
  {
    id: "a1",
    label: "Sales action",
    actionType: "whatsapp",
    destination: "https://wa.me/9647501234567",
    metadata: { platform: "whatsapp" },
    totalClicks: 6,
    uniqueClickers: 4,
    conversions: 3,
    conversionValue: 0,
    ctr: 4.6,
    recordState: "current",
  },
  {
    id: "a2",
    label: "Previous action",
    actionType: "custom",
    destination: null,
    totalClicks: 2,
    uniqueClickers: 1,
    conversions: 0,
    conversionValue: 0,
    ctr: 1.5,
    recordState: "historical",
  },
];
const report: SharedPageAnalytics = {
  name: "Customer page",
  pageType: "linktree",
  locale: "en",
  expiresAt: null,
  linktreeAnalytics: { totals, actions },
};
function appearance(region: HTMLElement) {
  return {
    text: region.textContent,
    classes: Array.from(region.querySelectorAll("[class]")).map((node) =>
      node.getAttribute("class"),
    ),
  };
}
afterEach(() => vi.unstubAllGlobals());
describe("shared report and analytics drawer parity", () => {
  it.each(["business", "platform-linktree"] as const)(
    "matches every section and style from the %s drawer in all languages",
    async (dataSource) => {
      for (const locale of ["en", "ar", "ckb"] as const) {
        vi.stubGlobal(
          "fetch",
          vi.fn(async (url: string) => ({
            ok: true,
            json: async () => ({
              data: url.includes("actions") ? actions : totals,
            }),
          })),
        );
        const labels = pageAnalyticsCopy(locale),
          insights = analyticsInsightsCopy[locale];
        const expand = () => {
          fireEvent.click(
            screen.getByRole("button", { name: insights.additional }),
          );
          fireEvent.click(
            screen.getByRole("button", { name: insights.outcomes }),
          );
          fireEvent.click(
            screen.getByRole("button", { name: `${insights.questions} · 5` }),
          );
          fireEvent.click(screen.getByText("Sales action").closest("button")!);
        };
        const drawer = render(
          <PageAnalyticsDrawer
            isOpen
            onClose={vi.fn()}
            pageId="page"
            pageName={report.name}
            locale={locale}
            dataSource={dataSource}
            canClearAnalytics={false}
          />,
        );
        const region = await screen.findByRole("region", {
          name: labels.title,
        });
        expect(within(region).getByText("131")).toBeVisible();
        const collapsed = appearance(region);
        expand();
        const expanded = appearance(region);
        expect(within(region).getByText("Price enquiry")).toBeVisible();
        drawer.unmount();
        const shared = render(
          <SharedAnalyticsReport
            data={report}
            locale={locale}
            apiBase="/share"
            onAccessLost={vi.fn()}
            rangeControl={
              <PageAnalyticsRange
                labels={labels}
                locale={locale}
                preset="all"
                setPreset={vi.fn()}
                customFrom=""
                customTo=""
                setCustomFrom={vi.fn()}
                setCustomTo={vi.fn()}
              />
            }
          />,
        );
        const sharedRegion = screen.getByRole("region", { name: labels.title });
        expect(appearance(sharedRegion)).toEqual(collapsed);
        expand();
        expect(appearance(sharedRegion)).toEqual(expanded);
        expect(
          screen.queryByRole("button", { name: labels.clearAll }),
        ).not.toBeInTheDocument();
        shared.unmount();
      }
    },
  );
  it("uses the same form overview before the response section", () => {
    const metrics: FormAnalytics = {
      views: 131,
      visitors: 97,
      starts: 50,
      submissions: 20,
      clicks: 40,
    };
    const copy = formsCopy("en");
    const overview = render(
      <FormAnalyticsOverview
        title="Form"
        metrics={metrics}
        copy={copy}
        locale="en"
      />,
    );
    const expected = overview.container.innerHTML;
    overview.unmount();
    render(
      <SharedAnalyticsReport
        data={{
          name: "Form",
          pageType: "form",
          locale: "en",
          expiresAt: null,
          formAnalytics: metrics,
          responses: { total: 0, items: [] },
        }}
        locale="en"
        apiBase="/share"
        onAccessLost={vi.fn()}
      />,
    );
    const section = screen.getByRole("region", { name: copy.analytics });
    expect(section.innerHTML).toEqual(expected);
    expect(
      section.compareDocumentPosition(
        screen.getByRole("region", { name: copy.submissions }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
  it("applies the drawer date presets through the grant-scoped report endpoint", async () => {
    request.mockResolvedValue(report);
    render(<SharedAnalyticsPage id="share" />);
    const labels = pageAnalyticsCopy("en");
    await screen.findByRole("region", { name: labels.title });
    fireEvent.click(screen.getByRole("button", { name: labels.last7dHint }));
    const from = new Date();
    from.setDate(from.getDate() - 6);
    const date = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;
    await waitFor(() =>
      expect(request).toHaveBeenLastCalledWith(
        `/api/public/analytics-shares/share?from=${date}`,
      ),
    );
    await screen.findByRole("region", { name: labels.title });
    fireEvent.click(screen.getByRole("button", { name: labels.allHint }));
    await waitFor(() =>
      expect(request).toHaveBeenLastCalledWith(
        "/api/public/analytics-shares/share",
      ),
    );
  });
});
