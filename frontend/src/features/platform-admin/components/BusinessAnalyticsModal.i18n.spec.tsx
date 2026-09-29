import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { BusinessAnalyticsModal } from "./BusinessAnalyticsModal";

vi.mock("@/lib/utils/cache", () => ({ fetchWithCache: vi.fn().mockResolvedValue([{ id: "page-1", name: "Page One", subtitle: "", image: null, background_color: "#000000", status: "active", is_default: true, unique_views: 12, unique_clicks: 3, total_clicks: 4 }]) }));

describe("platform business analytics language", () => {
  it("renders Arabic analytics controls and page labels", async () => {
    render(<PlatformLocaleProvider initialLocale="ar"><BusinessAnalyticsModal
      isOpen
      onClose={vi.fn()}
      businessId="business-1"
      businessName="Demo Business"
    /></PlatformLocaleProvider>);

    await waitFor(() => expect(screen.getByText("Page One")).toBeInTheDocument());
    expect(screen.getByRole("dialog", { name: "إحصاءات النشاط التجاري" })).toBeInTheDocument();
    expect(screen.getByLabelText("استيراد صفحات الروابط")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ابحث باسم الرابط...")).toBeInTheDocument();
    expect(screen.getByText("إجمالي المشاهدات")).toBeInTheDocument();
    expect(screen.getByText("رئيسية")).toBeInTheDocument();
  });
});
