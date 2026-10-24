import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

describe("shared delete confirmation focus", () => {
  it("submits a destructive action only once while its promise is pending", async () => {
    let finish!: () => void;
    const confirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const close = vi.fn();
    render(
      <ConfirmDeleteModal
        isOpen
        title="Remove domain?"
        message="Restore default"
        confirmLabel="Remove"
        onClose={close}
        onConfirm={confirm}
      />,
    );
    const removeButton = screen.getByRole("button", { name: "Remove" });
    fireEvent.click(removeButton);
    fireEvent.click(removeButton);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "true");
    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).not.toHaveBeenCalled();
    await act(async () => {
      finish();
    });
    expect(close).toHaveBeenCalledTimes(1);
  });
  it("traps keyboard focus within the confirmation", () => {
    render(
      <ConfirmDeleteModal
        isOpen
        title="Remove domain?"
        message="Restore the default website"
        cancelLabel="Cancel"
        confirmLabel="Remove"
        closeLabel="Close"
        onClose={vi.fn()}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    const dialog = screen.getByRole("dialog", { name: "Remove domain?" });
    const buttons = within(dialog).getAllByRole("button");
    expect(dialog).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(buttons.at(-1)).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(buttons[0]).toHaveFocus();
  });
});
