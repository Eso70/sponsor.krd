import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { SubscriptionPlansGrid } from "@/features/platform-admin/components/SubscriptionPlansGrid";
import { BusinessSubscriptionModal } from "./BusinessSubscriptionModal";

const plan = {
  id: "plan-max", code: "max", name: "Max", description: "", currency: "USD",
  monthlyPriceMinor: 6000, yearlyPriceMinor: 60000, trialDays: 0, isDefault: true,
  permissionProfileId: "profile-max", permissionProfileName: "Max", templateCount: 6,
  status: "active" as const, subscriberCount: 2, displayOrder: 40, createdAt: "", updatedAt: "",
  entitlements: { "limit.linktrees": -1, "limit.tiktok_pixels": 10, "feature.tiktok": true },
};

describe("shared subscription catalog", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("shows the live catalog and monthly/yearly prices in the business dashboard", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ success: true, data: {
      plans: [plan], access: { subscription: { planId: plan.id, planName: "Max", status: "expired", currentPeriodEnd: "2026-01-01" }, usage: {} },
    } }), { status: 200 })));
    render(<BusinessSubscriptionModal isOpen locale="en" onClose={vi.fn()} onSupport={vi.fn()} />);
    expect(await screen.findByText("Expired")).toBeInTheDocument();
    expect(screen.getByText("$600.00")).toBeInTheDocument();
    expect(screen.getByText("Unlimited")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
    expect(screen.getByText("$60.00")).toBeInTheDocument();
    expect(screen.getByText(/Online payments are not configured/)).toBeInTheDocument();
  });
  it("uses the same catalog in the platform dashboard and protects assigned/default plans", () => {
    render(<PlatformLocaleProvider initialLocale="en"><SubscriptionPlansGrid plans={[plan]}
      onView={vi.fn()} onEdit={vi.fn()} onPolicy={vi.fn()} onDelete={vi.fn()} /></PlatformLocaleProvider>);
    expect(screen.getByText("Unlimited")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete plan" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
    expect(screen.getByText("$60.00")).toBeInTheDocument();
  });
});
