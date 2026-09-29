import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  PlatformCampaignsPage,
  summarizeCampaigns,
} from "./PlatformCampaignsPage";
import { INITIAL_MOCK_CAMPAIGNS } from "../mock-data";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";

function renderCampaigns(locale: "ckb" | "ar" = "ckb") {
  return render(<PlatformLocaleProvider initialLocale={locale}><PlatformCampaignsPage /></PlatformLocaleProvider>);
}

describe("PlatformCampaignsPage", () => {
  it("localizes the campaign catalogue and table for Arabic administrators", () => {
    renderCampaigns("ar");

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
    expect(screen.getByText("spring-launch-v3.mp4")).toBeInTheDocument();
  });

  it("switches between the campaign grid and shared management table", () => {
    renderCampaigns();

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
    expect(
      within(createDialog).getByRole("button", { name: "Ismail CS" }),
    ).toBeInTheDocument();
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

  it("opens the redesigned campaign analytics details", () => {
    renderCampaigns();

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
