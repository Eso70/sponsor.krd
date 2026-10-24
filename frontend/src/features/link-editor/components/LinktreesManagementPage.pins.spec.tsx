import { lazy, Suspense, useState, type ComponentType } from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LinktreesManagementPage } from "./LinktreesManagementPage";
import type { LinktreeListItem } from "@linktree/types";

const request = vi.hoisted(() => vi.fn(async () => ({})));
vi.mock("@/lib/api/request", () => ({ apiRequest: request }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<unknown>) => {
    const Component = lazy(
      loader as () => Promise<{
        default: ComponentType<Record<string, unknown>>;
      }>,
    );
    return function Dynamic(props: Record<string, unknown>) {
      return (
        <Suspense fallback={null}>
          <Component {...props} />
        </Suspense>
      );
    };
  },
}));

const pages: LinktreeListItem[] = [
  {
    id: "default",
    uid: "id",
    name: "Default page",
    is_default: true,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "other",
    uid: "other",
    name: "Other page",
    created_at: "2026-04-01",
    updated_at: "2026-04-01",
  },
];

function Workspace({
  scope,
  initialItems = pages,
  viewMode = "grid",
  onClear = vi.fn(),
  canClear = true,
  canDelete = false,
  searchQuery = "",
}: {
  scope: "business" | "platform";
  initialItems?: LinktreeListItem[];
  viewMode?: "grid" | "table";
  onClear?: (ids: readonly string[]) => Promise<void>;
  canClear?: boolean;
  canDelete?: boolean;
  searchQuery?: string;
}) {
  const [items, setItems] = useState(initialItems);
  return (
    <LinktreesManagementPage
      linktrees={items}
      linktreeCount={items.length}
      totalViews={0}
      uniqueViews={0}
      totalClicks={0}
      uniqueClicks={0}
      contactActions={0}
      isLoading={false}
      isRefreshing={false}
      isClearingAnalytics={false}

      searchQuery={searchQuery}
      isSearchModalOpen={false}
      viewMode={viewMode}
      locale="en"
      listCopy={{
        paginationOf: "of",
        paginationNext: "Next",
        paginationPrevious: "Previous",
      }}
      onClearAnalytics={onClear}
      canClearAnalytics={canClear}
      canDelete={canDelete}
      onRefresh={vi.fn()}
      onSearchAction={vi.fn()}
      onViewModeChange={vi.fn()}
      onCreate={vi.fn()}
      onEdit={vi.fn()}
      onViewAnalytics={vi.fn()}
      pinApiBase={
        scope === "platform" ? "/api/platform/linktrees" : "/api/linktrees"
      }
      onPinnedChange={(id, pinned) =>
        setItems((current) =>
          current.map((item) =>
            item.id === id ? { ...item, is_pinned: pinned } : item,
          ),
        )
      }
    />
  );
}

describe.each(["business", "platform"] as const)(
  "Linktree pins in %s",
  (scope) => {
    it.each(["grid", "table"] as const)(
      "paginates the %s collection at fifteen items",
      async (viewMode) => {
        const initialItems = Array.from({ length: 16 }, (_, index) => ({
          ...pages[1],
          id: `item-${index}`,
          uid: `item-${index}`,
          name: `Item ${index}`,
        }));
        render(
          <Workspace
            scope={scope}
            initialItems={initialItems}
            viewMode={viewMode}
          />,
        );
        expect(await screen.findByText("1–15 of 16", {}, { timeout: 5000 })).toBeInTheDocument();
        if (viewMode === "table")
          expect(
            within(screen.getByRole("table")).getAllByRole("row"),
          ).toHaveLength(16);
        else
          expect(screen.getAllByRole("button", { name: "Pin" })).toHaveLength(
            15,
          );
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(await screen.findByText("16–16 of 16")).toBeInTheDocument();
        if (viewMode === "table")
          expect(
            within(screen.getByRole("table")).getAllByRole("row"),
          ).toHaveLength(2);
        else
          expect(screen.getAllByRole("button", { name: "Pin" })).toHaveLength(
            1,
          );
      },
    );
    it("moves a saved pin above the default page and restores the default after unpinning", async () => {
      render(<Workspace scope={scope} />);
      const controls = await screen.findAllByRole(
        "button",
        { name: "Pin" },
        { timeout: 10000 },
      );
      fireEvent.click(controls[1]);
      await screen.findByRole("button", { name: "Unpin" });
      expect(request).toHaveBeenCalledWith(
        `${scope === "platform" ? "/api/platform/linktrees" : "/api/linktrees"}/other/pin`,
        { method: "PATCH", json: { isPinned: true } },
      );
      const headings = () =>
        screen
          .getAllByRole("heading", { level: 3 })
          .map((node) => node.textContent)
          .filter((text) => text === "Default page" || text === "Other page");
      expect(headings()).toEqual(["Other page", "Default page"]);
      fireEvent.click(screen.getByRole("button", { name: "Unpin" }));
      await waitFor(() =>
        expect(headings()).toEqual(["Default page", "Other page"]),
      );
    });
  },
);


describe.each(["business", "platform"] as const)("Selected analytics in %s", (scope) => {
  it.each(["grid", "table"] as const)("reveals actions only after selecting in %s and clears only that page", async (viewMode) => {
    const onClear = vi.fn().mockResolvedValue(undefined);
    render(<Workspace scope={scope} viewMode={viewMode} onClear={onClear} />);
    expect(screen.queryByRole("button", { name: "Delete analytics" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Select all" })).not.toBeInTheDocument();
    const checkbox = (await screen.findAllByRole("checkbox", { name: "Select page: Other page" }))[0];
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "Delete analytics" }));
    const dialog = screen.getByRole("dialog");
    expect(onClear).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete analytics" }));
    await waitFor(() => expect(onClear).toHaveBeenCalledWith(["other"]));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Delete analytics" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Other page").length).toBeGreaterThan(0);
  });

  it.each(["grid", "table"] as const)("selects across pagination and deselects in %s", async (viewMode) => {
    const initialItems = Array.from({ length: 16 }, (_, index) => ({ ...pages[1], id: `item-${index}`, uid: `item-${index}`, name: `Item ${index}` }));
    const onClear = vi.fn().mockResolvedValue(undefined);
    render(<Workspace scope={scope} viewMode={viewMode} initialItems={initialItems} onClear={onClear} />);
    fireEvent.click((await screen.findAllByRole("checkbox", { name: "Select page: Item 0" }))[0]);
    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    expect(screen.getByRole("group", { name: "16 selected" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Deselect all" }));
    expect(screen.queryByRole("button", { name: "Delete analytics" })).not.toBeInTheDocument();
    expect(onClear).not.toHaveBeenCalled();
  });

  it("resets selection when the search changes and does not restore hidden selections", async () => {
    const { rerender } = render(<Workspace scope={scope} />);
    fireEvent.click((await screen.findAllByRole("checkbox", { name: "Select page: Other page" }))[0]);
    expect(screen.getByRole("button", { name: "Delete analytics" })).toBeInTheDocument();
    rerender(<Workspace scope={scope} searchQuery="Other" />);
    expect(screen.queryByRole("button", { name: "Delete analytics" })).not.toBeInTheDocument();
    rerender(<Workspace scope={scope} />);
    expect(screen.queryByRole("button", { name: "Delete analytics" })).not.toBeInTheDocument();
  });

  it("keeps the selection and confirmation available after deletion fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const onClear = vi.fn().mockRejectedValueOnce(new Error("Denied")).mockResolvedValueOnce(undefined);
    render(<Workspace scope={scope} onClear={onClear} />);
    fireEvent.click((await screen.findAllByRole("checkbox", { name: "Select page: Other page" }))[0]);
    fireEvent.click(screen.getByRole("button", { name: "Delete analytics" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete analytics" }));
    await waitFor(() => expect(onClear).toHaveBeenCalledOnce());
    await waitFor(() => expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete analytics" })).toBeEnabled());
    expect(screen.getByRole("group", { name: "1 selected" })).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete analytics" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onClear).toHaveBeenNthCalledWith(2, ["other"]);
    log.mockRestore();
  });

  it("hides selection without analytics-clear permission", async () => {
    render(<Workspace scope={scope} canClear={false} />);
    await screen.findByText("Other page");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});

describe.each(["business", "platform"] as const)("selected Linktree deletion in %s", (scope) => {
  it.each(["grid", "table"] as const)("deletes selected pages from %s but protects the default", async (viewMode) => {
    request.mockClear();
    render(<Workspace scope={scope} canDelete viewMode={viewMode} />);
    fireEvent.click((await screen.findAllByRole("checkbox", { name: "Select page: Default page" }))[0]);
    expect(screen.getByRole("button", { name: "Delete pages" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete pages" }));
    expect(request).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete pages" }));
    const base = scope === "platform" ? "/api/platform/linktrees" : "/api/linktrees";
    await waitFor(() => expect(request).toHaveBeenCalledWith(`${base}/other`, { method: "DELETE" }));
    expect(request).not.toHaveBeenCalledWith(`${base}/default`, expect.anything());
    expect(request).not.toHaveBeenCalledWith(expect.stringContaining("/analytics"), expect.anything());
  });

  it("supports delete-only permission without exposing analytics deletion", async () => {
    render(<Workspace scope={scope} canDelete canClear={false} />);
    fireEvent.click(await screen.findByRole("checkbox", { name: "Select page: Other page" }));
    expect(screen.getByRole("button", { name: "Delete pages" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Delete analytics" })).not.toBeInTheDocument();
  });
});
