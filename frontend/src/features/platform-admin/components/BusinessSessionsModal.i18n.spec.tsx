import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { BusinessSessionsModal } from "./BusinessSessionsModal";

describe("platform business sessions language", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("renders Arabic session copy from the shared panel", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { sessions: [] } }) }));
    render(<PlatformLocaleProvider initialLocale="ar"><BusinessSessionsModal
      business={{ id: "business-1", name: "Demo Business", username: "demo", subdomain: "demo", status: "active", phone: null, email: null, plan: "basic", planName: "Basic", subscriptionPlanId: null, max_linktrees: 3, logo: null, favicon: null, default_avatar: null, website_color: null, created_at: "", updated_at: "" }}
      onClose={vi.fn()}
    /></PlatformLocaleProvider>);

    expect(screen.getByText("جلسات النشاط التجاري")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إغلاق إدارة الجلسات" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("لا توجد جلسات نشطة.")).toBeInTheDocument());
    expect(screen.getByText("راجع الأجهزة التي يمكنها الوصول إلى هذا النشاط التجاري.")).toBeInTheDocument();
  });
});
