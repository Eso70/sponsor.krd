import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FileText, Settings } from "lucide-react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { businessMessages } from "@/features/business/i18n/messages";
import { platformCopy } from "@/features/platform-admin/i18n/copy";
import { readableInk } from "@/lib/utils/parse-website-color";

describe("dashboard website navigation", () => {
  it.each(["en", "ckb", "ar"] as const)(
    "keeps Website in the shared footer for both dashboard contexts in %s",
    (locale) => {
      for (const label of [
        businessMessages[locale].Sidebar.website,
        platformCopy[locale].website,
      ]) {
        const onClose = vi.fn();
        const { unmount, rerender } = render(
          <DashboardSidebar
            brandName="Business"
            brandSubtitle="Dashboard"
            brandImage="/logo.png"
            items={[]}
            collapsed={false}
            mobileOpen
            onCloseMobile={onClose}
            websiteLabel={label}
            footer={<button>Account</button>}
          />,
        );
        const link = screen.getByRole("link", { name: label });
        expect(
          link.closest("[data-dashboard-sidebar-footer]"),
        ).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/");
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
        expect(link.querySelector("svg")).toBeInTheDocument();
        fireEvent.click(link);
        expect(onClose).toHaveBeenCalledOnce();
        rerender(
          <DashboardSidebar
            brandName="Business"
            brandSubtitle="Dashboard"
            brandImage="/logo.png"
            items={[]}
            collapsed
            mobileOpen={false}
            onCloseMobile={onClose}
            websiteLabel={label}
          />,
        );
        expect(
          screen
            .getByRole("link", { name: label })
            .querySelector("span.md\\:hidden"),
        ).toBeInTheDocument();
        unmount();
      }
    },
  );

  it("removes the home action from the shared header", () => {
    render(
      <DashboardHeader
        title="Dashboard"
        theme="light"
        mounted
        refreshing={false}
        onToggleSidebar={vi.fn()}
        onToggleTheme={vi.fn()}
        onRefresh={vi.fn()}
        notifications={null}
        profile={{ items: [] }}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
  });

  it.each([
    ["#000000", "#ffffff"],
    ["#ffffff", "#ffffff"],
    ["#777777", "#ffffff"],
    ["gradient:to-r:#000000:#ffffff", "#ffffff"],
  ])(
    "uses readable selected text for tenant color %s in both dashboard modes",
    (accentColor, ink) => {
      const select = vi.fn(),
        close = vi.fn();
      const { container, rerender } = render(
        <DashboardSidebar
          accentColor={accentColor}
          brandName="Tenant"
          brandSubtitle="Dashboard"
          brandImage="/logo.png"
          collapsed={false}
          mobileOpen
          onCloseMobile={close}
          items={[
            {
              id: "pages",
              label: "Pages",
              icon: <FileText />,
              active: true,
              onClick: select,
            },
            {
              id: "settings",
              label: "Settings",
              icon: <Settings />,
              disabled: true,
              disabledReason: "Plan required",
              onClick: select,
            },
            {
              id: "hidden",
              label: "Hidden",
              icon: <Settings />,
              hidden: true,
              onClick: select,
            },
          ]}
        />,
      );
      expect(
        container
          .querySelector<HTMLElement>("aside")
          ?.style.getPropertyValue("--sidebar-ink"),
      ).toBe(ink);
      expect(
        readableInk(
          container
            .querySelector<HTMLElement>("aside")!
            .style.getPropertyValue("--sidebar-primary"),
        ),
      ).toBe("#ffffff");
      const active = screen.getByRole("button", { name: "Pages" });
      expect(active).toHaveAttribute("aria-current", "page");
      fireEvent.click(active);
      expect(select).toHaveBeenCalledOnce();
      expect(close).toHaveBeenCalledOnce();
      fireEvent.click(screen.getByRole("button", { name: "Settings" }));
      expect(select).toHaveBeenCalledOnce();
      expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
      rerender(
        <div className="dark">
          <DashboardSidebar
            accentColor={accentColor}
            brandName="Platform"
            brandSubtitle="Dashboard"
            brandImage="/logo.png"
            collapsed
            mobileOpen={false}
            onCloseMobile={close}
            items={[
              {
                id: "pages",
                label: "Pages",
                icon: <FileText />,
                active: true,
                onClick: select,
              },
            ]}
          />
        </div>,
      );
      expect(
        container
          .querySelector<HTMLElement>("aside")
          ?.style.getPropertyValue("--sidebar-ink"),
      ).toBe(ink);
      expect(screen.getByRole("button", { name: "Pages" })).toHaveAttribute(
        "data-collapsed",
        "true",
      );
    },
  );
});

it("keeps the closing backdrop mounted and prevents closed mobile navigation focus", () => {
  const previous = window.matchMedia;
  window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  try {
    const close = vi.fn();
    const props = { brandName: "Business", brandSubtitle: "Dashboard", brandImage: "/logo.png", items: [], collapsed: false, onCloseMobile: close };
    const { container, rerender } = render(<DashboardSidebar {...props} mobileOpen />);
    const backdrop = container.querySelector('button[data-open]')!;
    const sidebar = container.querySelector('aside')!;
    expect(backdrop).toHaveAttribute("data-open", "true");
    expect(sidebar).not.toHaveAttribute("inert");
    expect(sidebar).toContainElement(document.activeElement as HTMLElement);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledOnce();
    rerender(<DashboardSidebar {...props} mobileOpen={false} />);
    expect(backdrop).toBeInTheDocument();
    expect(backdrop).toHaveAttribute("aria-hidden", "true");
    expect(sidebar).toHaveAttribute("inert");
  } finally { window.matchMedia = previous; }
});
