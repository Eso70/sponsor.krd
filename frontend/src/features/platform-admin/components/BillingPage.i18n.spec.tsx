import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { BillingPage } from "./BillingPage";

const overview = {
  plans: [], permissionProfiles: [], subscriptions: [], businesses: [],
  summary: { activePlans: 0, activeSubscriptions: 0, attentionRequired: 0 },
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
};

describe("BillingPage Arabic", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("localizes plan and business subscription views", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: overview }), { status: 200 })));
    render(<PlatformLocaleProvider initialLocale="ar"><BillingPage /></PlatformLocaleProvider>);

    expect(await screen.findByText("الخطط النشطة")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "خطط الاشتراك" })).toBeInTheDocument();
    expect(screen.getByText("لا توجد خطط")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "الأنشطة التجارية" }));
    expect(screen.getByRole("heading", { name: "الأنشطة التجارية والاشتراكات" })).toBeInTheDocument();
    expect(screen.getByText("لم يُعثر على أنشطة تجارية")).toBeInTheDocument();
  });

  it("uses Arabic labels for both billing cycles in the new-plan form", async () => {
    const withProfile = {
      ...overview,
      permissionProfiles: [{ id: "profile-1", code: "basic", name: "Basic", permissionCount: 5 }],
    };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: withProfile }), { status: 200 })));
    render(<PlatformLocaleProvider initialLocale="ar"><BillingPage /></PlatformLocaleProvider>);

    fireEvent.click(await screen.findByRole("button", { name: "خطة جديدة" }));
    expect(screen.getByText("خطة اشتراك جديدة")).toBeInTheDocument();
    expect(screen.getByLabelText(/السعر · شهري/)).toBeInTheDocument();
    expect(screen.getByLabelText(/السعر · سنوي/)).toBeInTheDocument();
  });

  it("localizes the overview and plan form in English", async () => {
    const withProfile = { ...overview, permissionProfiles: [{ id: "profile-1", code: "basic", name: "Basic", permissionCount: 5 }] };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: withProfile }), { status: 200 })));
    render(<PlatformLocaleProvider initialLocale="en"><BillingPage /></PlatformLocaleProvider>);
    expect(await screen.findByText("Active plans")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Subscription plans" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "New plan" }));
    expect(screen.getByText("New subscription plan")).toBeInTheDocument();
    expect(screen.getByLabelText(/Price · Monthly/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price · Yearly/)).toBeInTheDocument();
  });
});

