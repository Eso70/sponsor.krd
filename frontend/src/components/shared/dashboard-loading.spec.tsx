import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dashboardLoadingKind } from "./dashboard-loading";
import { DashboardPageLoading } from "./DashboardPageLoading";
import { DashboardLoadingShell } from "./DashboardLoadingShell";

describe("route-matched dashboard loading", () => {
  it.each([
    ["/business/pages", "business", "linktrees"],
    ["/business/forms/", "business", "forms"],
    ["/business/settings", "business", "settings"],
    ["/business/templates", "business", "templates"],
    ["/business/tiktok-config", "business", "tiktok"],
    ["/console/linktrees", "platform", "linktrees"],
    ["/console/forms?lang=ar", "platform", "forms"],
    ["/console/templates", "platform", "templates"],
    ["/console/businesses", "platform", "businesses"],
    ["/console", "platform", "businesses"],
    ["/console/settings", "platform", "pending"],
    ["/console/billing", "platform", "pending"],
    ["/business/unknown", "business", "pending"],
  ] as const)(
    "matches %s without guessing another page layout",
    (path, scope, kind) => {
      expect(dashboardLoadingKind(path, scope)).toBe(kind);
    },
  );

  it.each(["business", "platform"] as const)(
    "keeps %s owner branding during route loading",
    (scope) => {
      const { container } = render(
        <DashboardLoadingShell scope={scope} accentColor="#6543ab">
          <DashboardPageLoading
            pathname={
              scope === "business" ? "/business/pages" : "/console/linktrees"
            }
            scope={scope}
            locale="en"
          />
        </DashboardLoadingShell>,
      );
      expect(screen.getAllByRole("status")).toHaveLength(1);
      const themeScope =
        container.querySelector<HTMLElement>("[data-theme-scope]");
      expect(themeScope?.style.getPropertyValue("--theme-primary")).toBe(
        "#6543ab",
      );
      expect(container.querySelectorAll("[data-stat-card]")).toHaveLength(6);
      expect(
        container.querySelectorAll("article:not([data-stat-card])"),
      ).toHaveLength(6);
    },
  );

  it("does not show business cards while opening platform settings", () => {
    const { container } = render(
      <DashboardPageLoading
        pathname="/console/settings"
        scope="platform"
        locale="en"
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    expect(container.querySelector("[data-stat-card]")).toBeNull();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
