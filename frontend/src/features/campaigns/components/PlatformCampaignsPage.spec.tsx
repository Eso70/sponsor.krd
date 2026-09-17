import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  PlatformCampaignsPage,
  summarizeCampaigns,
} from "./PlatformCampaignsPage";
import { INITIAL_MOCK_CAMPAIGNS } from "../mock-data";

describe("PlatformCampaignsPage", () => {
  it("renders the shared six-card campaign summary", () => {
    render(<PlatformCampaignsPage />);

    expect(screen.getByText("کۆی کەمپەینەکان")).toBeInTheDocument();
    expect(screen.getByText(/کەمپەینی چالاک/)).toBeInTheDocument();
    expect(screen.getByText("کۆی پیشاندانەکان")).toBeInTheDocument();
    expect(screen.getByText("کۆی کلیکەکان")).toBeInTheDocument();
    expect(screen.getByText("کۆی خەرجی")).toBeInTheDocument();
    expect(screen.getByText("کۆی گۆڕانەکان")).toBeInTheDocument();
    expect(screen.getAllByText("تێچووی هەر گۆڕانێک").length).toBeGreaterThan(0);
    expect(screen.getByText("بەڕێوەبردنی کەمپەینەکان")).toBeInTheDocument();
    expect(screen.queryByText("4 / 4")).not.toBeInTheDocument();
    expect(screen.getByText("spring-launch-v3.mp4")).toBeInTheDocument();
  });

  it("switches between the campaign grid and shared management table", () => {
    render(<PlatformCampaignsPage />);

    fireEvent.click(screen.getByRole("button", { name: "بینینی خشتە" }));

    expect(
      screen.getByRole("columnheader", { name: "ڤیدیۆ" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "بودجە / خەرجی" }),
    ).toBeInTheDocument();
  });

  it("opens the frontend-only campaign creation flow", () => {
    render(<PlatformCampaignsPage />);

    fireEvent.click(screen.getByRole("button", { name: "کەمپەینی نوێ" }));

    const createDialog = screen.getByRole("dialog", {
      name: "دروستکردنی کەمپەینی نوێ لە TikTok",
    });
    expect(createDialog).toBeInTheDocument();
    expect(
      within(createDialog).getByLabelText(/Campaign, Ad Group & Ad name/),
    ).toHaveValue("");
    expect(
      within(createDialog).getByRole("radio", { name: /Reach/ }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      within(createDialog).queryByText(
        "گەیاندنی ڕیکلامەکە بە زۆرترین ژمارەی بینەری گونجاو",
      ),
    ).not.toBeInTheDocument();

    fireEvent.change(
      within(createDialog).getByLabelText(/Campaign, Ad Group & Ad name/),
      { target: { value: "September campaign" } },
    );

    expect(
      within(createDialog).getByText("Optimization and bidding"),
    ).toBeInTheDocument();
    expect(
      within(createDialog).getByRole("button", { name: "Leads" }),
    ).toBeInTheDocument();
    expect(
      within(createDialog).queryByText("Data connection"),
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(createDialog).getByRole("radio", { name: /Website Lead/ }),
    );

    expect(
      within(createDialog).getByText("Data connection"),
    ).toBeInTheDocument();
    expect(
      within(createDialog).getByRole("button", { name: "Ismail CS" }),
    ).toBeInTheDocument();
    expect(
      within(createDialog).getByText("Optimization event"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(createDialog).getByRole("button", { name: "بەردەوام بە" }),
    );
    expect(
      within(createDialog).getByText("Budget and schedule"),
    ).toBeInTheDocument();
    expect(
      within(createDialog).getByText("Audience targeting and placement"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(createDialog).getByRole("button", { name: "بەردەوام بە" }),
    );
    expect(
      within(createDialog).getByText("Destination and ad assets"),
    ).toBeInTheDocument();
    fireEvent.change(within(createDialog).getByLabelText(/Video code/), {
      target: { value: "TT-VIDEO-001" },
    });
    fireEvent.change(within(createDialog).getByLabelText(/Ad text/), {
      target: { value: "Discover the new campaign" },
    });

    expect(
      within(createDialog).getByRole("heading", {
        name: "Interactive add-ons",
      }),
    ).toBeInTheDocument();
    expect(within(createDialog).getByText("Optional")).toBeInTheDocument();
    expect(
      within(createDialog).getByRole("button", {
        name: "دروستکردنی کەمپەین",
      }),
    ).toBeEnabled();
  });

  it("opens the redesigned campaign analytics details", () => {
    render(<PlatformCampaignsPage />);

    fireEvent.click(screen.getAllByRole("button", { name: "وردەکاری" })[0]);

    const detailsDialog = screen.getByRole("dialog", {
      name: "کەمپەینی بەهار ٢٠٢٦ - ڕیکلامی تایبەت",
    });
    expect(detailsDialog).toBeInTheDocument();
    expect(
      within(detailsDialog).getByText("ئەنجامی کەمپەین"),
    ).toBeInTheDocument();
    expect(
      within(detailsDialog).getByText("ڕێژەی گۆڕان 7.18%"),
    ).toBeInTheDocument();
    expect(within(detailsDialog).getByText("$0.68")).toBeInTheDocument();
  });

  it("derives every total from the campaign collection", () => {
    expect(summarizeCampaigns(INITIAL_MOCK_CAMPAIGNS)).toEqual({
      campaigns: 4,
      activeCampaigns: 2,
      impressions: 142470,
      clicks: 9150,
      totalSpent: 539.6,
      conversions: 725,
    });
  });
});
