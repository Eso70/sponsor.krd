import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BusinessLinktreesPage } from "./BusinessLinktreesPage";
import { LinktreesManagementPage } from "@/features/link-editor/components/LinktreesManagementPage";
import { BusinessLocaleProvider } from "@/features/business/i18n/BusinessLocaleProvider";

const props = {
  linktrees: [],
  linktreeCount: 0,
  isLoading: false,
  totalViews: 0,
  uniqueViews: 0,
  totalClicks: 0,
  conversions: 0,
  isRefreshing: false,
  isClearingAnalytics: false,
  hasAnalyticsData: false,
  searchQuery: "",
  isSearchModalOpen: false,
  viewMode: "grid" as const,
  onClearAnalytics: vi.fn(),
  onRefresh: vi.fn(),
  onSearchAction: vi.fn(),
  onViewModeChange: vi.fn(),
  onCreate: vi.fn(),
  onEdit: vi.fn(),
  onViewAnalytics: vi.fn(),
};

describe("Linktree management language", () => {
  it("shows Arabic Business headings and actions", () => {
    render(
      <BusinessLocaleProvider initialLocale="ar">
        <BusinessLinktreesPage {...props} />
      </BusinessLocaleProvider>,
    );

    expect(screen.getByRole("heading", { name: "الصفحات" })).toBeInTheDocument();
    expect(screen.getByText("إجمالي صفحات لينكتري")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "صفحة جديدة" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تحديث" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "لا توجد بيانات" })).toBeInTheDocument();
  });

  it("passes Arabic copy through to the Business page cards", async () => {
    render(
      <BusinessLocaleProvider initialLocale="ar">
        <BusinessLinktreesPage
          {...props}
          linktrees={[{
            id: "page-1",
            uid: "page-one",
            name: "Page one",
            created_at: "2026-09-01T00:00:00.000Z",
            updated_at: "2026-09-02T00:00:00.000Z",
          }]}
        />
      </BusinessLocaleProvider>,
    );

    // The page-card chunk is dynamically imported and can take longer under
    // the full parallel suite than Testing Library's one-second default.
    expect(await screen.findByRole("button", { name: "نسخ الرابط" }, { timeout: 15_000 })).toBeInTheDocument();
    expect(screen.getByText("تاريخ الإنشاء")).toBeInTheDocument();
  }, 20_000);

  it("keeps the shared Platform screen on its existing Kurdish copy", () => {
    render(<LinktreesManagementPage {...props} accentMode="platform" />);

    expect(screen.getByRole("heading", { name: "پەیجەکان" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "پەیجی نوێ" })).toBeInTheDocument();
  });
});
