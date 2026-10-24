import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageEngagementOverview } from "./PageEngagementOverview";
import { PageAnalyticsSkeleton } from "./PageAnalyticsSkeleton";
import { analyticsInsightsCopy } from "../analytics-insights-copy";

const insights = {
  measuredVisits: 2,
  averageActiveSeconds: 20,
  engagedVisits: 1,
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
        id: "q1",
        label: "Price enquiry",
        historical: false,
        clicks: 3,
        uniqueVisitors: 2,
        lastSelectedAt: null,
        links: [{ label: "Sales", clicks: 3 }],
      },
    ],
  },
};
describe("progressive analytics details", () => {
  it.each(["en", "ar", "ckb"] as const)(
    "keeps essentials visible with localized optional sections in %s",
    (locale) => {
      const copy = analyticsInsightsCopy[locale];
      render(<PageEngagementOverview insights={insights} locale={locale} />);
      expect(screen.queryByText(copy.contact)).not.toBeInTheDocument();
      expect(screen.queryByText(copy.activeTime)).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: copy.additional }));
      expect(screen.getByText(copy.contact)).toBeVisible();
      expect(screen.getByText(copy.contacts)).toBeVisible();
      expect(screen.getAllByText(copy.activeTime)[0]).toBeVisible();
      fireEvent.click(
        screen.getByRole("button", { name: new RegExp(copy.questions) }),
      );
      expect(screen.getByText("Price enquiry")).toBeVisible();
      expect(screen.getByText("100.0%")).toBeVisible();
      fireEvent.click(
        screen.getByRole("button", { name: new RegExp(copy.questions) }),
      );
      expect(screen.queryByText("Price enquiry")).not.toBeInTheDocument();
    },
  );
  it("reserves all metric text with shared skeletons and keeps detail sections closed", () => {
    const { container } = render(<PageAnalyticsSkeleton locale="en" />);
    expect(screen.queryByText("Total views")).not.toBeInTheDocument();
    expect(container.querySelectorAll("[data-stat-card][data-state=loading]")).toHaveLength(4);
    expect(screen.queryByText("Contact actions")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "WhatsApp questions" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Select dates manually" }),
    ).toBeDisabled();
  });
});
