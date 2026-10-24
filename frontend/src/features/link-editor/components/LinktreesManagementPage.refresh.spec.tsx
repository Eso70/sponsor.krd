import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LinktreesManagementPage, type LinktreesManagementPageProps } from "./LinktreesManagementPage";

vi.mock("next/dynamic", () => ({
  default: () => ({ isLoading, data }: { isLoading: boolean; data: { name: string }[] }) =>
    isLoading ? <div role="status">Refreshing collection</div> : <div>{data.map((item) => item.name).join(", ")}</div>,
}));

describe.each(["tenant", "platform"] as const)("Linktree refresh feedback (%s)", (accentMode) => {
  it.each(["grid", "table"] as const)("refreshes statistics and the %s together without resetting controls", (viewMode) => {
    const props: LinktreesManagementPageProps = {
      linktrees: [{ id: "page-1", uid: "page-one", name: "Original page", created_at: "2026-10-01", updated_at: "2026-10-01" }],
      linktreeCount: 1, totalViews: 10, uniqueViews: 5, totalClicks: 4, uniqueClicks: 3, contactActions: 1,
      isLoading: false, isRefreshing: false, isClearingAnalytics: false,
      listCopy: { loadingCards: "Loading page cards", loadingTable: "Loading page table" },
      searchQuery: "Original", isSearchModalOpen: false, viewMode, accentMode, locale: "en",
      onClearAnalytics: vi.fn(), onRefresh: vi.fn(), onSearchAction: vi.fn(), onViewModeChange: vi.fn(),
      onCreate: vi.fn(), onEdit: vi.fn(), onViewAnalytics: vi.fn(),
    };
    const view = render(<LinktreesManagementPage {...props} />);
    expect(screen.getByText("Original page")).toBeInTheDocument();
    // Hydrated list rows must wait for the initially pending summary, like Forms.
    view.rerender(<LinktreesManagementPage {...props} analyticsLoading />);
    expect(screen.queryByText("Original page")).not.toBeInTheDocument();
    expect(screen.queryByText("10")).not.toBeInTheDocument();
    view.rerender(<LinktreesManagementPage {...props} isLoading analyticsLoading={false} />);
    expect(screen.queryByText("Original page")).not.toBeInTheDocument();
    expect(screen.queryByText("10")).not.toBeInTheDocument();
    view.rerender(<LinktreesManagementPage {...props} isRefreshing />);
    expect(screen.getByRole("status", { name: viewMode === "grid" ? "Loading page cards" : "Loading page table" })).toBeInTheDocument();
    expect(screen.queryByText("Original page")).not.toBeInTheDocument();
    expect(screen.queryByText("10")).not.toBeInTheDocument();
    view.rerender(<LinktreesManagementPage {...props} totalViews={20} linktrees={[{ ...props.linktrees[0], name: "Updated page" }]} />);
    expect(screen.getByText("Updated page")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(props.onViewModeChange).not.toHaveBeenCalled();
    expect(props.onSearchAction).not.toHaveBeenCalled();
  });
});
