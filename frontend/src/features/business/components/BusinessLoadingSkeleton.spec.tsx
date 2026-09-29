import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BusinessLocaleProvider } from "@/features/business/i18n/BusinessLocaleProvider";
import { BusinessLoadingSkeleton } from "./BusinessLoadingSkeleton";

describe("Business loading skeletons", () => {
  it("announces Arabic loading labels in the Business editor and analytics modal", () => {
    const { rerender } = render(
      <BusinessLocaleProvider initialLocale="ar">
        <BusinessLoadingSkeleton kind="linktreeEditor" />
      </BusinessLocaleProvider>,
    );
    expect(screen.getByRole("status", { name: "جارٍ تحميل محرر صفحات الروابط" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "جارٍ تحميل معلومات صفحة الروابط" })).toBeInTheDocument();

    rerender(
      <BusinessLocaleProvider initialLocale="ar">
        <BusinessLoadingSkeleton kind="pageAnalytics" />
      </BusinessLocaleProvider>,
    );
    expect(screen.getByRole("status", { name: "جارٍ تحميل إحصائيات الصفحة" })).toBeInTheDocument();
  });

  it("keeps Kurdish loading labels for Kurdish Business members", () => {
    render(
      <BusinessLocaleProvider initialLocale="ckb">
        <BusinessLoadingSkeleton kind="settings" />
      </BusinessLocaleProvider>,
    );
    expect(screen.getByRole("status", { name: "ڕێکخستنەکان بار دەکرێن" })).toBeInTheDocument();
  });
});
