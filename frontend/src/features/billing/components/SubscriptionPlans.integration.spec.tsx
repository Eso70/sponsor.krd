import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { SubscriptionPlansGrid } from "@/features/platform-admin/components/SubscriptionPlansGrid";
import { BusinessSubscriptionModal } from "./BusinessSubscriptionModal";

const plan = {
  id: "plan-max",
  code: "max",
  name: "Max",
  description: "",
  currency: "USD",
  monthlyPriceMinor: 6000,
  yearlyPriceMinor: 60000,
  trialDays: 0,
  isDefault: true,
  permissionProfileId: "profile-max",
  permissionProfileName: "Max",
  templateCount: 6,
  status: "active" as const,
  subscriberCount: 2,
  displayOrder: 40,
  createdAt: "",
  updatedAt: "",
  entitlements: {
    "limit.linktrees": -1,
    "limit.tiktok_pixels": 10,
    "feature.tiktok": true,
  },
};

describe("shared subscription catalog", () => {
  afterEach(() => vi.unstubAllGlobals());
  it.each([
    ["en", "Coming soon", "Close"],
    ["ckb", "بەم زووانە", "داخستن"],
    ["ar", "قريبًا", "إغلاق"],
  ] as const)(
    "shows only the unfinished-feature message in %s without loading billing",
    (locale, message, closeLabel) => {
      const fetch = vi.fn();
      const onClose = vi.fn();
      vi.stubGlobal("fetch", fetch);
      render(
        <BusinessSubscriptionModal isOpen locale={locale} onClose={onClose} />,
      );
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Monthly" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Max")).not.toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: closeLabel }));
      expect(onClose).toHaveBeenCalledOnce();
    },
  );
  it("uses the same catalog in the platform dashboard and protects assigned/default plans", () => {
    render(
      <PlatformLocaleProvider initialLocale="en">
        <SubscriptionPlansGrid
          plans={[plan]}
          onView={vi.fn()}
          onEdit={vi.fn()}
          onPolicy={vi.fn()}
          onDelete={vi.fn()}
        />
      </PlatformLocaleProvider>,
    );
    expect(screen.getByText("Unlimited")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete plan" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
    expect(screen.getByText("$60.00")).toBeInTheDocument();
  });
});
