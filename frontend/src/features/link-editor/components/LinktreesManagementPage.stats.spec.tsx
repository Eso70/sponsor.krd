import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  LinktreesManagementPage,
  type LinktreesManagementPageProps,
} from "./LinktreesManagementPage";
vi.mock("next/dynamic", () => ({ default: () => () => null }));
const props: LinktreesManagementPageProps = {
  linktrees: [],
  linktreeCount: 23,
  totalViews: 124,
  uniqueViews: 39,
  totalClicks: 266,
  uniqueClicks: 14,
  contactActions: 17,
  isLoading: false,
  analyticsLoading: false,
  isRefreshing: false,
  isClearingAnalytics: false,

  searchQuery: "filtered page",
  isSearchModalOpen: false,
  viewMode: "grid",
  locale: "en",
  onClearAnalytics: vi.fn(),
  onRefresh: vi.fn(),
  onSearchAction: vi.fn(),
  onViewModeChange: vi.fn(),
  onCreate: vi.fn(),
  onEdit: vi.fn(),
  onViewAnalytics: vi.fn(),
};
describe.each(["tenant", "platform"] as const)(
  "Linktree overview pending parity (%s)",
  (accentMode) => {
    it("waits for both requests and replaces all six cards together, including refresh", () => {
      const { rerender } = render(
        <LinktreesManagementPage
          {...props}
          accentMode={accentMode}
          analyticsLoading
        />,
      );
      expect(screen.getAllByRole("status")).toHaveLength(7);
      expect(screen.queryByText("23")).not.toBeInTheDocument();
      rerender(
        <LinktreesManagementPage
          {...props}
          accentMode={accentMode}
          isLoading
        />,
      );
      expect(screen.getAllByRole("status")).toHaveLength(7);
      rerender(<LinktreesManagementPage {...props} accentMode={accentMode} />);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      for (const value of ["23", "124", "39", "266", "14", "17"])
        expect(screen.getByText(value)).toBeInTheDocument();
      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
      rerender(
        <LinktreesManagementPage
          {...props}
          accentMode={accentMode}
          isRefreshing
        />,
      );
      expect(screen.getAllByRole("status")).toHaveLength(7);
    });
  },
);
