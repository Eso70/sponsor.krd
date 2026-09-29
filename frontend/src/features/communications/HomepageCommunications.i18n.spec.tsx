import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";
import { HomepageCommunications } from "./HomepageCommunications";

vi.mock("./api", () => ({
  communicationRequest: vi.fn(async () => [
    {
      id: "banner", title: "Owner announcement", message: "Owner message",
      announcementType: "general", priority: "normal", publishedAt: "2026-09-01T00:00:00Z",
      placement: "top_banner", displayPriority: 1, isDismissible: true,
    },
    {
      id: "feature", title: "Owner feature", message: "Owner description",
      announcementType: "general", priority: "normal", publishedAt: "2026-09-01T00:00:00Z",
      placement: "feature_card", displayPriority: 1, isDismissible: true,
    },
  ]),
}));

describe("homepage communication controls", () => {
  it.each([
    { locale: "ckb" as const, announcement: "داخستنی ڕاگەیاندن", feature: "داخستنی تایبەتمەندی" },
    { locale: "ar" as const, announcement: "إغلاق الإعلان", feature: "إغلاق الميزة" },
    { locale: "en" as const, announcement: "Dismiss announcement", feature: "Dismiss feature" },
  ])("localizes dismiss buttons in $locale without changing authored content", async ({ locale, announcement, feature }) => {
    render(<RootPublicLocaleProvider initialLocale={locale}><HomepageCommunications /></RootPublicLocaleProvider>);
    expect(await screen.findByRole("button", { name: announcement })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: feature })).toBeInTheDocument();
    expect(screen.getByText("Owner announcement")).toBeInTheDocument();
  });
});
