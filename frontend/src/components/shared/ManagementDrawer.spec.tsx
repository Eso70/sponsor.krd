import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DrawerPresence } from "./DrawerPresence";
import { ManagementDrawer } from "./ManagementDrawer";

describe("ManagementDrawer", () => {
  it("keeps one surface when retained content updates during its parent exit", async () => {
    let update = () => {};
    function UpdatingDrawer() {
      const [revision, setRevision] = useState(0);
      update = () => setRevision((value) => value + 1);
      return <ManagementDrawer isOpen title="Updating editor" onClose={vi.fn()}>{revision}</ManagementDrawer>;
    }
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const view = render(<DrawerPresence><UpdatingDrawer /></DrawerPresence>);
    try {
      const dialog = screen.getByRole("dialog", { name: "Updating editor" });
      await waitFor(() => expect(dialog.style.transform).toBe("none"));
      view.rerender(<DrawerPresence>{null}</DrawerPresence>);
      expect(dialog.closest("[data-drawer-state]")).toHaveAttribute("data-drawer-state", "closing");
      act(() => update());
      expect(screen.getAllByRole("dialog", { name: "Updating editor" })).toHaveLength(1);
      expect(error.mock.calls.filter((call) => String(call[0]).includes("same key"))).toHaveLength(0);
      await waitFor(() => expect(dialog).not.toBeInTheDocument());
      expect(document.body.style.overflow).not.toBe("hidden");
    } finally {
      view.unmount();
      error.mockRestore();
    }
  });
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
    const previousGutter = document.documentElement.style.scrollbarGutter;
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
    expect(document.documentElement.style.scrollbarGutter).toBe("stable");
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
    expect(document.documentElement.style.scrollbarGutter).toBe(previousGutter);
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

  it("retains the surface, focus and scroll lock until a controlled close completes", async () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    const close = vi.fn();
    const { rerender } = render(
      <ManagementDrawer isOpen title="Retained editor" onClose={close}>
        Content
      </ManagementDrawer>,
    );
    const dialog = screen.getByRole("dialog", { name: "Retained editor" });
    fireEvent.keyDown(document, { key: "Escape" });
    rerender(
      <ManagementDrawer isOpen={false} title="Retained editor" onClose={close}>
        Content
      </ManagementDrawer>,
    );
    expect(dialog).toBeInTheDocument();
    expect(dialog.closest("[data-drawer-state]")).toHaveAttribute(
      "data-drawer-state",
      "closing",
    );
    expect(document.body.style.overflow).toBe("hidden");
    expect(dialog).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledOnce();
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(document.body.style.overflow).not.toBe("hidden");
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it("animates conditionally removed owners and reverses a close when reopened", async () => {
    const content = (
      <ManagementDrawer isOpen title="Conditional editor" onClose={vi.fn()}>
        Content
      </ManagementDrawer>
    );
    const { rerender } = render(<DrawerPresence>{content}</DrawerPresence>);
    const dialog = screen.getByRole("dialog", { name: "Conditional editor" });
    rerender(<DrawerPresence>{null}</DrawerPresence>);
    expect(dialog).toBeInTheDocument();
    expect(dialog.closest("[data-drawer-state]")).toHaveAttribute(
      "data-drawer-state",
      "closing",
    );
    rerender(<DrawerPresence>{content}</DrawerPresence>);
    expect(screen.getByRole("dialog", { name: "Conditional editor" })).toBe(
      dialog,
    );
    await waitFor(() => expect(dialog.style.transform).toBe("none"));
    expect(dialog.closest("[data-drawer-state]")).toHaveAttribute(
      "data-drawer-state",
      "open",
    );
    expect(document.body.style.overflow).toBe("hidden");
    rerender(<DrawerPresence>{null}</DrawerPresence>);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });

  it("does not replay the entrance when lazy loading replaces its drawer skeleton", () => {
    const { rerender } = render(
      <DrawerPresence>
        <ManagementDrawer
          key="loading"
          isOpen
          title="Loading"
          onClose={vi.fn()}
        >
          Skeleton
        </ManagementDrawer>
      </DrawerPresence>,
    );
    // The owner/session stays stable while a lazy component swaps its fallback.
    rerender(
      <DrawerPresence>
        <section key="loading">
          <ManagementDrawer isOpen title="Loaded" onClose={vi.fn()}>
            Editor
          </ManagementDrawer>
        </section>
      </DrawerPresence>,
    );
    const dialog = screen.getByRole("dialog", { name: "Loaded" });
    expect(dialog.style.transform).toBe("none");
  });

  it("preserves the newer overlay's scroll lock and focus if an older drawer closes first", async () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    const first = (
      <ManagementDrawer isOpen title="First" onClose={vi.fn()}>
        One
      </ManagementDrawer>
    );
    const second = (
      <ManagementDrawer isOpen title="Second" onClose={vi.fn()}>
        Two
      </ManagementDrawer>
    );
    const { rerender } = render(
      <>
        {first}
        <ManagementDrawer isOpen={false} title="Second" onClose={vi.fn()}>
          Two
        </ManagementDrawer>
      </>,
    );
    rerender(
      <>
        {first}
        {second}
      </>,
    );
    const newest = screen.getByRole("dialog", { name: "Second" });
    expect(newest).toHaveFocus();
    rerender(
      <>
        <ManagementDrawer isOpen={false} title="First" onClose={vi.fn()}>
          One
        </ManagementDrawer>
        {second}
      </>,
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "First" }),
      ).not.toBeInTheDocument(),
    );
    expect(document.body.style.overflow).toBe("hidden");
    expect(newest).toHaveFocus();
    rerender(
      <>
        <ManagementDrawer isOpen={false} title="First" onClose={vi.fn()}>
          One
        </ManagementDrawer>
        <ManagementDrawer isOpen={false} title="Second" onClose={vi.fn()}>
          Two
        </ManagementDrawer>
      </>,
    );
    await waitFor(() => expect(newest).not.toBeInTheDocument());
    expect(document.body.style.overflow).not.toBe("hidden");
    expect(opener).toHaveFocus();
    opener.remove();
  });
});
