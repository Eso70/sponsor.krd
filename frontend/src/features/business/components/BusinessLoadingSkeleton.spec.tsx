import { LinktreeEditorLoadingContent } from "@/features/link-editor/components/LinktreeEditorLoadingContent";
import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BusinessLocaleProvider } from "@/features/business/i18n/BusinessLocaleProvider";
import { BusinessLoadingSkeleton } from "./BusinessLoadingSkeleton";

describe("Business loading skeletons", () => {
  it("announces Arabic loading labels in the Business editor and analytics modal", async () => {
    const { rerender } = render(
      <BusinessLocaleProvider initialLocale="ar">
        <LinktreeEditorLoadingContent label="جارٍ تحميل معلومات صفحة الروابط" previewLabel="جارٍ تحميل معاينة الصفحة" />
      </BusinessLocaleProvider>,
    );
    const frame = screen.getByTitle("جارٍ تحميل معاينة الصفحة") as HTMLIFrameElement;
    await waitFor(() => expect(within(frame.contentDocument!.body).getByRole("status", { name: "جارٍ تحميل معاينة الصفحة" })).toBeInTheDocument());
    expect(screen.getByRole("status", { name: "جارٍ تحميل معلومات صفحة الروابط" })).toBeInTheDocument();

    rerender(
      <BusinessLocaleProvider initialLocale="ar">
        <BusinessLoadingSkeleton kind="pageAnalytics" />
      </BusinessLocaleProvider>,
    );
    expect(screen.getByRole("dialog", { name: "جارٍ تحميل إحصائيات الصفحة" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "جارٍ تحميل بيانات إحصائيات الصفحة" })).toBeInTheDocument();
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
