import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LinktreesManagementPage } from "./LinktreesManagementPage";

vi.mock("next/dynamic", () => ({ default: () => () => null }));

describe.each(["tenant", "platform"] as const)(
  "Shared Linktree toolbar (%s)",
  (accentMode) => {
    it("shares archive, view, search and refresh controls across both surfaces", () => {
      const refresh = vi.fn();
      const view = vi.fn();
      const search = vi.fn();
      render(
        <LinktreesManagementPage
          linktrees={[]}
          linktreeCount={0}
          isLoading={false}
          totalViews={0}
          uniqueViews={0}
          totalClicks={0}
          conversions={0}
          isRefreshing={false}
          isClearingAnalytics={false}
          hasAnalyticsData={false}
          searchQuery=""
          isSearchModalOpen={false}
          viewMode="grid"
          onClearAnalytics={vi.fn()}
          onRefresh={refresh}
          onSearchAction={search}
          onViewModeChange={view}
          onCreate={vi.fn()}
          onEdit={vi.fn()}
          onViewAnalytics={vi.fn()}
          onToggleArchive={vi.fn()}
          accentMode={accentMode}
          copy={{
            active: "Active",
            archived: "Archive",
            gridView: "Grid",
            tableView: "Table",
            search: "Search",
            refresh: "Refresh",
          }}
        />,
      );
      const active = screen.getByRole("button", { name: "Active" });
      expect(active).toHaveAttribute("aria-pressed", "true");
      expect(active).toHaveClass(
        accentMode === "platform" ? "sa-gradient" : "theme-fill",
      );
      fireEvent.click(screen.getByRole("button", { name: "Archive" }));
      expect(screen.getByRole("button", { name: "Archive" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      fireEvent.click(screen.getByRole("button", { name: "Table" }));
      expect(view).toHaveBeenCalledWith("table");
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      expect(search).toHaveBeenCalledOnce();
      fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
      expect(refresh).toHaveBeenCalledOnce();
    });
  },
);
