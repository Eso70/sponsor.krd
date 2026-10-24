import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LinktreesManagementPage } from "./LinktreesManagementPage";

vi.mock("next/dynamic", () => ({ default: () => () => null }));

describe.each(["tenant", "platform"] as const)(
  "Shared Linktree toolbar (%s)",
  (accentMode) => {
    it("shares archive, view and search controls without a duplicate refresh action", () => {
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
          uniqueClicks={0}
          contactActions={0}
          isRefreshing={false}
          isClearingAnalytics={false}

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
      for (const name of ["Grid", "Table"]) {
        const control = screen.getByRole("button", { name });
        expect(control).toHaveTextContent(name);
        expect(control.querySelector("svg")).toBeNull();
      }

      expect(
        screen.queryByRole("button", { name: /campaign|کەمپەین|الحملة/i }),
      ).not.toBeInTheDocument();
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
      expect(
        screen.queryByRole("button", { name: "Refresh" }),
      ).not.toBeInTheDocument();
      expect(refresh).not.toHaveBeenCalled();
    });
  },
);
