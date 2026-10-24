import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Skeleton,
  SkeletonCardGrid,
  SkeletonDashboardPage,
  SkeletonDashboardShell,
  SkeletonForm,
  SkeletonList,
  SkeletonManagementPage,
  SkeletonModal,
  SkeletonPublicLinktreePage,
  SkeletonStatCards,
  SkeletonStatCard,
  SkeletonTable,
  SkeletonTemplatePage,
  SkeletonText,
} from "@/components/shared/Skeleton";
import { SkeletonAuthenticationPage } from "@/components/shared/SkeletonAuthenticationPage";

describe("loading skeletons", () => {
  it("holds still for a reader who asked for less motion", () => {
    const { container } = render(<Skeleton className="h-4 w-10" />);
    const block = container.firstElementChild;

    expect(block?.className).not.toMatch(/\banimate-/);
  });

  it("hides the placeholder blocks from assistive technology", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.firstElementChild).toHaveAttribute("data-skeleton");
  });

  it("announces the wait once per group rather than per block", () => {
    render(<SkeletonTable rows={4} />);
    // One status for the group; the blocks inside stay hidden, so a screen
    // reader hears "loading" rather than four dozen empty elements.
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("renders the number of rows it was asked for", () => {
    const { container } = render(<SkeletonTable rows={4} />);
    expect(
      container.querySelectorAll("[data-skeleton-table-row]"),
    ).toHaveLength(4);
    expect(
      container.querySelectorAll("[data-skeleton-mobile-row]"),
    ).toHaveLength(4);
  });

  it("ends a block of text short, the way a paragraph does", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const lines = Array.from(
      container.querySelectorAll("[aria-hidden='true']"),
    );

    expect(lines).toHaveLength(3);
    expect(lines[0].className).toContain("w-full");
    expect(lines[2].className).toContain("w-2/3");
  });

  it("mirrors the layout it stands in for", () => {
    const grid = render(<SkeletonCardGrid count={3} />);
    // Same count as the cards that will land, so nothing shifts on arrival.
    expect(grid.container.querySelectorAll(".rounded-2xl")).toHaveLength(3);
    grid.unmount();

    const stats = render(<SkeletonStatCards count={4} />);
    expect(stats.container.firstElementChild?.className).toContain(
      "lg:grid-cols-4",
    );
    stats.unmount();

    const list = render(<SkeletonList rows={5} />);
    expect(list.container.querySelectorAll(".p-3")).toHaveLength(5);
  });

  it("provides layout-matched form, page, and dialog fallbacks", () => {
    const form = render(<SkeletonForm fields={3} />);
    expect(
      form.getByRole("status", { name: "Loading form data" }),
    ).toBeInTheDocument();
    form.unmount();

    const page = render(<SkeletonManagementPage cardCount={2} statCount={6} />);
    expect(
      page.getByRole("status", { name: "Loading management page" }),
    ).toBeInTheDocument();
    page.unmount();

    const modal = render(<SkeletonModal />);
    expect(
      modal.getByRole("status", { name: "Loading dialog" }),
    ).toBeInTheDocument();
    expect(modal.getAllByRole("status")).toHaveLength(1);
  });

  it.each(["analytics", "table", "form"] as const)(
    "provides one accessible status for the %s dashboard body",
    (body) => {
      render(<SkeletonDashboardPage body={body} statCount={4} tabCount={3} />);
      expect(
        screen.getByRole("status", { name: "Loading dashboard data" }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("status")).toHaveLength(1);
    },
  );

  it("reserves the shared dashboard sidebar and header during route loading", () => {
    const { container } = render(<SkeletonDashboardShell />);

    expect(container.querySelector("aside")).toBeInTheDocument();
    expect(container.querySelector("header")).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Loading dashboard data" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it.each([false, true])(
    "matches the actual dashboard controls (platform=%s)",
    (platformAdminTheme) => {
      const { container, rerender } = render(
        <SkeletonDashboardShell platformAdminTheme={platformAdminTheme} />,
      );
      const sidebar = container.querySelector("aside")!;
      expect(
        sidebar.querySelectorAll('[data-sidebar-skeleton="item"]'),
      ).toHaveLength(platformAdminTheme ? 9 : 5);
      expect(
        sidebar.querySelector('[data-sidebar-skeleton="plan"]') !== null,
      ).toBe(!platformAdminTheme);
      expect(
        sidebar.querySelector('[data-sidebar-skeleton="support"]') !== null,
      ).toBe(!platformAdminTheme);
      expect(
        sidebar.querySelector('[data-sidebar-skeleton="settings"]') !== null,
      ).toBe(platformAdminTheme);
      expect(
        sidebar.querySelector('[data-sidebar-skeleton="website"]'),
      ).toBeInTheDocument();
      expect(
        Array.from(container.querySelectorAll("[data-header-skeleton]")).map(
          (element) => element.getAttribute("data-header-skeleton"),
        ),
      ).toEqual([
        "menu",
        "refresh",
        "notifications",
        "language",
        "theme",
        "profile",
      ]);
      expect(
        container.querySelector('[data-header-skeleton="profile"]'),
      ).toHaveClass("h-8", "w-8", "sm:h-9", "md:h-11");
      expect(container.querySelectorAll("button, a, input")).toHaveLength(0);
      rerender(
        <SkeletonDashboardShell
          platformAdminTheme={platformAdminTheme}
          navigationItems={3}
          sidebarCollapsed
        />,
      );
      expect(container.querySelector("aside")).toHaveClass("w-20");
      expect(
        container.querySelectorAll('[data-sidebar-skeleton="item"]'),
      ).toHaveLength(3);
      expect(
        container.querySelectorAll(
          '[data-sidebar-skeleton="item"][data-collapsed="true"]',
        ),
      ).toHaveLength(3);
    },
  );

  it("opts platform loading into the shared platform theme without changing tenant loading", () => {
    const { container, rerender } = render(
      <SkeletonDashboardShell platformAdminTheme />,
    );
    expect(container.firstElementChild).toHaveAttribute(
      "data-platform-admin-theme",
    );

    rerender(<SkeletonDashboardShell />);
    expect(container.firstElementChild).not.toHaveAttribute(
      "data-platform-admin-theme",
    );
  });

  it("reserves the shared authentication shell during route loading", () => {
    render(
      <SkeletonAuthenticationPage brandDescription="Secure account access" />,
    );

    expect(
      screen.getByRole("status", { name: "Loading authentication" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("reserves the complete template catalog while permissions load", () => {
    render(<SkeletonTemplatePage />);
    expect(
      screen.getByRole("status", { name: "Loading templates" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("reserves the public Linktree identity, links, and footer", () => {
    const { container } = render(<SkeletonPublicLinktreePage />);
    expect(
      screen.getByRole("status", { name: "Loading Linktree page" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("[data-skeleton-link-row]")).toHaveLength(
      5,
    );
  });

  it.each([false, true])(
    "uses the shared metric shell with compact=%s",
    (compact) => {
      const { container } = render(<SkeletonStatCard compact={compact} />);
      expect(container.querySelector("[data-stat-card]")).toHaveAttribute(
        "data-state",
        "loading",
      );
      expect(
        container.querySelector("[data-stat-card-value] [data-skeleton]"),
      ).toBeInTheDocument();
      expect(
        container.querySelector("[data-stat-card-caption] [data-skeleton]"),
      ).toBeInTheDocument();
    },
  );
});
