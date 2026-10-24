import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchModal } from "./SearchModal";

describe("shared search dialog", () => {
  it("focuses search, traps focus and restores its opener", async () => {
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const close = vi.fn();
    const { unmount } = render(<SearchModal isOpen onClose={close} placeholder="Search pages"
      searchQuery="" onSearchQueryChange={vi.fn()}><button>Result</button></SearchModal>);
    const dialog = await screen.findByRole("dialog", { name: "Search pages" });
    const input = within(dialog).getByRole("searchbox");
    expect(input).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(input, { key: "Tab", shiftKey: true });
    expect(within(dialog).getByRole("button", { name: "Result" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledTimes(1);
    unmount();
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).not.toBe("hidden");
    opener.remove();
  });

  it("clears the query and keeps focus ready for typing", async () => {
    const change = vi.fn();
    const close = vi.fn();
    render(<SearchModal isOpen onClose={close} placeholder="Search templates"
      searchQuery="Spotlight" onSearchQueryChange={change} />);
    const dialog = await screen.findByRole("dialog", { name: "Search templates" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Clear search" }));
    expect(change).toHaveBeenCalledWith("");
    expect(within(dialog).getByRole("searchbox")).toHaveFocus();
    fireEvent.keyDown(within(dialog).getByRole("searchbox"), { key: "Enter" });
    expect(close).toHaveBeenCalledTimes(1);
    expect(dialog.parentElement).not.toHaveAttribute("data-platform-admin-theme");
    expect(dialog.parentElement?.style.getPropertyValue("--theme-primary")).toBe("");
  });
});
