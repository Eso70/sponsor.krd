import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ManagementDrawer } from "./ManagementDrawer";

describe("ManagementDrawer", () => {
  it("focuses an entering drawer without scrolling its offscreen panel into view", () => {
    const focus = vi.spyOn(HTMLElement.prototype, "focus");
    try {
      render(
        <ManagementDrawer isOpen title="Sliding drawer" onClose={vi.fn()}>
          Content
        </ManagementDrawer>,
      );
      expect(
        screen.getByRole("dialog", { name: "Sliding drawer" }),
      ).toHaveFocus();
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
      expect(document.querySelector(".modal-ltr")).toHaveClass("overflow-clip");
    } finally {
      focus.mockRestore();
    }
  });
  it("shares modal semantics, theme and keyboard focus while locking body scroll", () => {
    const onClose = vi.fn();
    const previous = document.body.style.overflow;
    const { unmount } = render(
      <ManagementDrawer
        isOpen
        title="Editor"
        description="Description"
        onClose={onClose}
        accentColor="#2563eb"
      >
        <button type="button">Last</button>
      </ManagementDrawer>,
    );
    const dialog = screen.getByRole("dialog", { name: "Editor" });
    expect(dialog).toHaveFocus();
    expect(dialog).toHaveAccessibleDescription("Description");
    expect(document.body.style.overflow).toBe("hidden");
    expect(
      document
        .querySelector<HTMLElement>(".modal-ltr")
        ?.style.getPropertyValue("--theme-primary"),
    ).toBe("#2563eb");
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(screen.getByRole("button", { name: "Last" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    expect(document.body.style.overflow).toBe(previous);
  });
  it("returns focus to its opener on dismissal", () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(
      <ManagementDrawer isOpen title="Editor" onClose={vi.fn()}>
        Content
      </ManagementDrawer>,
    );
    unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });
});
