import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlatformBusiness } from "@linktree/types";
import { PlatformLocaleProvider } from "../i18n/PlatformLocaleProvider";
import { BusinessCardActions } from "./BusinessCardActions";

const item = {
  id: "business-id",
  name: "A very long business name",
  subdomain: "tenant",
  status: "active",
} as PlatformBusiness;

describe("business grid actions", () => {
  it("keeps all six actions accessible and bound to the selected business", () => {
    const callbacks = {
      onViewAnalytics: vi.fn(),
      onEdit: vi.fn(),
      onManageDomains: vi.fn(),
      onManageSessions: vi.fn(),
      onOpenDashboard: vi.fn(),
      onDelete: vi.fn(),
    };
    render(
      <PlatformLocaleProvider initialLocale="en">
        <BusinessCardActions item={item} {...callbacks} />
      </PlatformLocaleProvider>,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(6);
    expect(buttons[0]).toHaveTextContent("Analytics");
    expect(buttons[1]).toHaveTextContent("Edit");
    buttons.forEach((button) => {
      expect(button).toHaveAccessibleName(new RegExp(item.name));
      fireEvent.click(button);
    });
    for (const callback of [
      callbacks.onViewAnalytics,
      callbacks.onEdit,
      callbacks.onManageDomains,
      callbacks.onManageSessions,
      callbacks.onOpenDashboard,
    ]) {
      expect(callback).toHaveBeenCalledExactlyOnceWith(item);
    }
    expect(callbacks.onDelete).toHaveBeenCalledExactlyOnceWith(
      item.id,
      item.name,
    );
  });

  it("does not expose absent capabilities or open a suspended business dashboard", () => {
    render(
      <PlatformLocaleProvider initialLocale="en">
        <BusinessCardActions
          item={{ ...item, status: "suspended" }}
          onOpenDashboard={vi.fn()}
          onManageDomains={vi.fn()}
        />
      </PlatformLocaleProvider>,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button")).toHaveAccessibleName(
      `Custom domains: ${item.name}`,
    );
  });
});
