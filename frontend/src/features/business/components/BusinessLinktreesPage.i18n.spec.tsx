import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DashboardRefreshTestShell } from "@/test-utils/DashboardRefreshTestShell";
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
  uniqueClicks: 0,
  contactActions: 0,
  isRefreshing: false,
  isClearingAnalytics: false,

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
  it("refreshes Business Linktrees only through the global header", async () => {
    const refresh = vi.fn();
    render(
      <DashboardRefreshTestShell>
        <BusinessLocaleProvider initialLocale="en">
          <BusinessLinktreesPage {...props} onRefresh={refresh} />
        </BusinessLocaleProvider>
      </DashboardRefreshTestShell>,
    );
    expect(screen.getAllByRole("button", { name: "Refresh" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledWith(true));
    expect(refresh).toHaveBeenCalledOnce();
  });
  it("shows Arabic Business headings and actions", () => {
    render(
      <BusinessLocaleProvider initialLocale="ar">
        <BusinessLinktreesPage {...props} />
      </BusinessLocaleProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "الصفحات" }),
    ).toBeInTheDocument();
    expect(screen.getByText("المشاهدات")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إنشاء" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "تحديث" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "حذف الإحصاءات" }),
    ).not.toBeInTheDocument();
  });

  it("passes Arabic copy through to the Business page cards", async () => {
    render(
      <BusinessLocaleProvider initialLocale="ar">
        <BusinessLinktreesPage
          {...props}
          linktrees={[
            {
              id: "page-1",
              uid: "page-one",
              name: "Page one",
              created_at: "2026-09-01T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            },
          ]}
        />
      </BusinessLocaleProvider>,
    );

    // The page-card chunk is dynamically imported and can take longer under
    // the full parallel suite than Testing Library's one-second default.
    expect(
      await screen.findByRole(
        "button",
        { name: "نسخ الرابط" },
        { timeout: 15_000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("تاريخ الإنشاء")).toBeInTheDocument();
  }, 20_000);

  it("keeps the shared Platform screen on its existing Kurdish copy", () => {
    render(<LinktreesManagementPage {...props} accentMode="platform" />);

    expect(
      screen.getByRole("heading", { name: "پەیجەکان" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "پەیجی نوێ" }),
    ).toBeInTheDocument();
  });
});
