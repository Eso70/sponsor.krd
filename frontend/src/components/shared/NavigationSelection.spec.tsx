import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { FileText, Settings, LayoutTemplate } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedTabs } from "./SegmentedTabs";
import { SegmentedControl } from "./SegmentedControl";
import { DashboardSidebar } from "./DashboardSidebar";

const tabs = [
  { id: "first", label: "First", icon: FileText },
  { id: "second", label: "Second", icon: LayoutTemplate },
  { id: "third", label: "Third", icon: Settings },
];

describe("shared sliding navigation", () => {
  it.each([false, true])(
    "selects only the final tab and retains keyboard navigation (RTL=%s)",
    (rtl) => {
      const change = vi.fn();
      function Tabs() {
        const [value, setValue] = useState("first");
        return (
          <div dir={rtl ? "rtl" : "ltr"}>
            <SegmentedTabs
              tabs={tabs}
              value={value}
              onChange={(next) => {
                change(next);
                setValue(next);
              }}
              label="Page settings"
            />
          </div>
        );
      }
      const { container } = render(<Tabs />);
      expect(
        container.querySelectorAll("[data-navigation-highlight]"),
      ).toHaveLength(1);
      const last = screen.getByRole("tab", { name: "Third" });
      fireEvent.click(last);
      expect(change.mock.calls).toEqual([["third"]]);
      expect(last).toHaveAttribute("aria-selected", "true");
      expect(last.querySelector("[data-navigation-highlight]")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      // Explicit direction keeps this assertion independent of JSDOM's inherited CSS support.
      last.style.direction = rtl ? "rtl" : "ltr";
      fireEvent.keyDown(last, { key: rtl ? "ArrowRight" : "ArrowLeft" });
      expect(change).toHaveBeenLastCalledWith("second");
      expect(screen.getByRole("tab", { name: "Second" })).toHaveFocus();
      fireEvent.keyDown(screen.getByRole("tab", { name: "Second" }), {
        key: "Home",
      });
      expect(change).toHaveBeenLastCalledWith("first");
    },
  );

  it("keeps independent tab and pressed-control selections with platform accent support", () => {
    const change = vi.fn();
    const { container, rerender } = render(
      <>
        <SegmentedTabs tabs={tabs} value="first" onChange={change} />
        <SegmentedControl
          options={tabs.map(({ id, label }) => ({ value: id, label }))}
          value="third"
          onChange={change}
          accentMode="platform"
        />
      </>,
    );
    expect(
      container.querySelectorAll("[data-navigation-highlight]"),
    ).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Second" }));
    expect(change).toHaveBeenCalledExactlyOnceWith("second");
    rerender(
      <SegmentedControl
        options={tabs.map(({ id, label }) => ({ value: id, label }))}
        value="second"
        onChange={change}
      />,
    );
    expect(screen.getByRole("button", { name: "Second" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it.each(["Tenant dashboard", "Platform dashboard"])(
    "shares moving sidebar selection in %s without triggering intermediate pages",
    (brandSubtitle) => {
      const change = vi.fn();
      function Sidebar() {
        const [value, setValue] = useState("first");
        return (
          <DashboardSidebar
            brandName="Sponsor.krd"
            brandSubtitle={brandSubtitle}
            brandImage="/logo.png"
            accentColor="#8754df"
            collapsed={false}
            mobileOpen={false}
            onCloseMobile={vi.fn()}
            items={tabs.map((tab) => ({
              id: tab.id,
              label: tab.label,
              icon: <tab.icon />,
              active: value === tab.id,
              onClick: () => {
                change(tab.id);
                setValue(tab.id);
              },
            }))}
          />
        );
      }
      const { container } = render(<Sidebar />);
      const nav = within(container.querySelector("nav")!);
      fireEvent.click(nav.getByRole("button", { name: "Third" }));
      expect(change.mock.calls).toEqual([["third"]]);
      expect(nav.getByRole("button", { name: "Third" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(
        nav
          .getByRole("button", { name: "Third" })
          .querySelector("[data-navigation-highlight]"),
      ).toBeInTheDocument();
    },
  );
});
