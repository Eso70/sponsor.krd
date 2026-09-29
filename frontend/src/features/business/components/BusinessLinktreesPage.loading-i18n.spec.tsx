import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BusinessLocaleProvider } from "@/features/business/i18n/BusinessLocaleProvider";
import { BusinessLinktreesPage } from "./BusinessLinktreesPage";
import { LinktreesManagementPage } from "@/features/link-editor/components/LinktreesManagementPage";

vi.mock("next/dynamic", () => ({
  default: (_loader: unknown, options: { loading: () => React.ReactNode }) => options.loading,
}));

const props = {
  linktrees: [{
    id: "page-1",
    uid: "page-one",
    name: "Page one",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-02T00:00:00.000Z",
  }],
  linktreeCount: 1,
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

describe("Linktree page chunk loading announcements", () => {
  it("uses Arabic in both Business views", () => {
    const { rerender } = render(
      <BusinessLocaleProvider initialLocale="ar">
        <BusinessLinktreesPage {...props} />
      </BusinessLocaleProvider>,
    );
    expect(screen.getByRole("status", { name: "جارٍ تحميل بطاقات الصفحات" })).toBeInTheDocument();

    rerender(
      <BusinessLocaleProvider initialLocale="ar">
        <BusinessLinktreesPage {...props} viewMode="table" />
      </BusinessLocaleProvider>,
    );
    expect(screen.getByRole("status", { name: "جارٍ تحميل جدول الصفحات" })).toBeInTheDocument();
  });

  it("uses Kurdish loading announcements for the default Platform screen", () => {
    render(<LinktreesManagementPage {...props} accentMode="platform" />);
    expect(screen.getByRole("status", { name: "پەیجەکان بار دەکرێن" })).toBeInTheDocument();
  });
});
