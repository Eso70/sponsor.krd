import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { SkeletonMediaSettings, SkeletonRetentionSettings } from "./PlatformSettingsSkeletons";

describe("Platform Settings loading labels", () => {
  it("uses Arabic accessible labels when the administrator selects Arabic", () => {
    render(
      <PlatformLocaleProvider initialLocale="ar">
        <SkeletonRetentionSettings />
        <SkeletonMediaSettings />
      </PlatformLocaleProvider>,
    );

    expect(screen.getByRole("status", { name: "جارٍ تحميل إعدادات الاحتفاظ بالبيانات" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "جارٍ تحميل إعدادات الوسائط" })).toBeInTheDocument();
  });
});
