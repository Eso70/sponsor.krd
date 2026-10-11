import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PlatformCampaignsPage,
  summarizeCampaigns,
} from "./PlatformCampaignsPage";
import type { TikTokCampaign } from "../types";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";

function storeCampaign() {
  const campaign: TikTokCampaign = {
      id: "saved-campaign", name: "Saved campaign", objective: "REACH", status: "active",
      video: { title: "saved.mp4", duration: "00:18", format: "9:16", resolution: "1080 × 1920", tone: "cyan" },
      dailyBudget: 25, totalSpent: 165.4, impressions: 48920, clicks: 3410, ctr: 6.97, cpc: 0.048, conversions: 245,
      destinationPage: { id: "destination", title: "Website", slug: "home", type: "website" },
      targetAudience: { location: "Iraq", gender: "ALL", ageGroups: ["18-24"], languages: ["English"] },
      callToAction: "Learn more", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
    };
  window.localStorage.setItem("platform_tiktok_campaigns", JSON.stringify([campaign]));
}

beforeEach(() => {
  const entries = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
    clear: () => entries.clear(),
  });
});
afterEach(() => vi.unstubAllGlobals());

function renderCampaigns(locale: "ckb" | "ar" = "ckb") {
  return render(<PlatformLocaleProvider initialLocale={locale}><PlatformCampaignsPage /></PlatformLocaleProvider>);
}

describe("PlatformCampaignsPage", () => {
  it("localizes the campaign catalogue and table for Arabic administrators", async () => {
    storeCampaign();
    renderCampaigns("ar");
    await screen.findByText("saved.mp4");

    expect(screen.getByText("إجمالي الحملات")).toBeInTheDocument();
    expect(screen.getByText("إدارة الحملات")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "عرض الجدول" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "عرض الجدول" }));
    expect(screen.getByRole("columnheader", { name: "الفيديو" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "الميزانية / الإنفاق" })).toBeInTheDocument();
  });

  it("localizes the creation wizard for Arabic administrators", () => {
    renderCampaigns("ar");
    fireEvent.click(screen.getByRole("button", { name: "حملة جديدة" }));

    const dialog = screen.getByRole("dialog", { name: "إنشاء حملة جديدة على تيك توك" });
    expect(within(dialog).getByText("هيكل الحملة")).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/اسم الحملة والمجموعة الإعلانية والإعلان/)).toBeInTheDocument();
    expect(within(dialog).getByRole("radio", { name: "الوصول" })).toBeInTheDocument();
    expect(within(dialog).getByText("التحسين والمزايدة")).toBeInTheDocument();
  });

  it("renders the shared six-card campaign summary", () => {
    renderCampaigns();

    expect(screen.getByText("کۆی کەمپەینەکان")).toBeInTheDocument();
    expect(screen.getByText(/کەمپەینی چالاک/)).toBeInTheDocument();
    expect(screen.getByText("کۆی پیشاندانەکان")).toBeInTheDocument();
    expect(screen.getByText("کۆی کلیکەکان")).toBeInTheDocument();
    expect(screen.getByText("کۆی خەرجی")).toBeInTheDocument();
    expect(screen.getByText("کۆی گۆڕانەکان")).toBeInTheDocument();
    expect(screen.getAllByText("تێچووی هەر گۆڕانێک").length).toBeGreaterThan(0);
    expect(screen.getByText("بەڕێوەبردنی کەمپەینەکان")).toBeInTheDocument();
    expect(screen.queryByText("4 / 4")).not.toBeInTheDocument();
    expect(screen.queryByText("spring-launch-v3.mp4")).not.toBeInTheDocument();
  });

  it("switches between the campaign grid and shared management table", async () => {
    storeCampaign();
    renderCampaigns();
    await screen.findByText("saved.mp4");

    fireEvent.click(screen.getByRole("button", { name: "بینینی خشتە" }));

    expect(
      screen.getByRole("columnheader", { name: "ڤیدیۆ" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "بودجە / خەرجی" }),
    ).toBeInTheDocument();
  });

  it("opens the frontend-only campaign creation flow", () => {
    renderCampaigns();

    fireEvent.click(screen.getByRole("button", { name: "کەمپەینی نوێ" }));

    const createDialog = screen.getByRole("dialog", {
      name: "دروستکردنی کەمپەینی نوێ لە TikTok",
    });
    expect(createDialog).toBeInTheDocument();
    expect(
      within(createDialog).getByLabelText(/ناوی کەمپەین، گرووپی ڕیکلام و ڕیکلام/),
    ).toHaveValue("");
    expect(
      within(createDialog).getByRole("radio", { name: /گەیشتن/ }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      within(createDialog).queryByText(
        "گەیاندنی ڕیکلامەکە بە زۆرترین ژمارەی بینەری گونجاو",
      ),
    ).not.toBeInTheDocument();

    fireEvent.change(
      within(createDialog).getByLabelText(/ناوی کەمپەین، گرووپی ڕیکلام و ڕیکلام/),
      { target: { value: "September campaign" } },
    );

    expect(
      within(createDialog).getByText("باشترکردن و پێشنیاری نرخ"),
    ).toBeInTheDocument();
    expect(
      within(createDialog).getByRole("button", { name: "کڕیارە شیاوەکان" }),
    ).toBeInTheDocument();
    expect(
      within(createDialog).queryByText("پەیوەندی داتا"),
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(createDialog).getByRole("radio", { name: /کڕیاری شیاوی وێبسایت/ }),
    );

    expect(
      within(createDialog).getByText("پەیوەندی داتا"),
    ).toBeInTheDocument();
    const dataConnection = within(createDialog).getByRole("textbox", { name: "پەیوەندی داتا" });
    expect(dataConnection).toHaveValue("");
    expect(within(createDialog).getByRole("button", { name: "بەردەوام بە" })).toBeDisabled();
    fireEvent.change(dataConnection, { target: { value: "pixel-123" } });
    expect(
      within(createDialog).getByText("ڕووداوی باشترکردن"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(createDialog).getByRole("button", { name: "بەردەوام بە" }),
    );
    expect(
      within(createDialog).getByText("بودجە و خشتەی کات"),
    ).toBeInTheDocument();
    expect(
      within(createDialog).getByText("ئامانجکردنی بینەر و شوێنی پیشاندان"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(createDialog).getByRole("button", { name: "بەردەوام بە" }),
    );
    expect(
      within(createDialog).getByText("مەبەست و ناوەڕۆکی ڕیکلام"),
    ).toBeInTheDocument();
    fireEvent.change(within(createDialog).getByLabelText(/کۆدی ڤیدیۆ/), {
      target: { value: "TT-VIDEO-001" },
    });
    fireEvent.change(within(createDialog).getByLabelText(/دەقی ڕیکلام/), {
      target: { value: "Discover the new campaign" },
    });

    expect(
      within(createDialog).getByRole("heading", {
        name: "زیادکراوە کارلێکییەکان",
      }),
    ).toBeInTheDocument();
    expect(within(createDialog).getByText("ئارەزوومەندانە")).toBeInTheDocument();
    expect(
      within(createDialog).getByRole("button", {
        name: "دروستکردنی کەمپەین",
      }),
    ).toBeEnabled();
  });

  it("opens the redesigned campaign analytics details", async () => {
    storeCampaign();
    const saved = JSON.parse(window.localStorage.getItem("platform_tiktok_campaigns")!);
    window.localStorage.setItem("platform_tiktok_campaigns", JSON.stringify([
      ...saved, { ...saved[0], id: "camp-001", name: "Legacy sample" },
    ]));
    renderCampaigns();
    await screen.findAllByRole("button", { name: "وردەکاری" });

    fireEvent.click(screen.getAllByRole("button", { name: "وردەکاری" })[0]);

    expect(screen.queryByText("Legacy sample")).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem("platform_tiktok_campaigns")!)).toHaveLength(1);
    const detailsDialog = screen.getByRole("dialog", {
      name: "Saved campaign",
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
    expect(summarizeCampaigns([])).toEqual({
      campaigns: 0,
      activeCampaigns: 0,
      impressions: 0,
      clicks: 0,
      totalSpent: 0,
      conversions: 0,
    });
  });
});
