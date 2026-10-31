import { createRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PickerPopup } from "./PickerPopup";

describe("shared visual picker popup", () => {
  it.each(["light", "dark"])("inherits the local %s theme and dismisses with Escape", async (appearance) => {
    const anchor = createRef<HTMLButtonElement>();
    const close = vi.fn();
    render(<div className={appearance === "light" ? "dark" : "light"}>
      <div data-appearance={appearance}><button ref={anchor}>Design</button>
        <PickerPopup isOpen anchorRef={anchor} onClose={close} title="Page design" closeLabel="Close">
          <button>Option</button>
        </PickerPopup>
      </div>
    </div>);
    const popup = await screen.findByRole("dialog", { name: "Page design" });
    expect(popup).toHaveAttribute("data-appearance", appearance);
    expect(popup).toHaveAttribute("aria-modal", "false");
    expect(popup).toHaveAttribute("data-picker-surface");
    // The dialog renders before its keyboard/focus effects have mounted.
    await waitFor(() => expect(popup).toHaveFocus());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledOnce();
  });
  it("dismisses on outside click while allowing option interaction", async () => {
    const anchor = createRef<HTMLButtonElement>();
    const close = vi.fn();
    const select = vi.fn();
    render(<><button ref={anchor}>Pattern</button>
      <PickerPopup isOpen anchorRef={anchor} onClose={close} title="Pattern" closeLabel="Close">
        <button onClick={select}>Dots</button>
      </PickerPopup>
    </>);
    const popup = await screen.findByRole("dialog");
    // Outside-dismissal listeners mount with the focus effect after the portal.
    await waitFor(() => expect(popup).toHaveFocus());
    fireEvent.pointerDown(screen.getByRole("button", { name: "Dots" }));
    fireEvent.click(screen.getByRole("button", { name: "Dots" }));
    expect(select).toHaveBeenCalledOnce();
    expect(close).not.toHaveBeenCalled();
    fireEvent.pointerDown(document.body);
    expect(close).toHaveBeenCalledOnce();
  });
});
