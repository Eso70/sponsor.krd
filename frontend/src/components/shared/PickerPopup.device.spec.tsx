import { act, fireEvent, render, waitFor, within } from "@testing-library/react";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PickerPopup } from "./PickerPopup";

function DevicePicker() {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return <><button ref={anchorRef} onClick={() => setOpen(true)}>Pick date</button>
    <PickerPopup isOpen={open} onClose={() => setOpen(false)} anchorRef={anchorRef} title="Date" closeLabel="Close" width={340}>
      <button>Today</button>
    </PickerPopup></>;
}

describe("anchored pickers in device previews", () => {
  it("portals and repositions within the phone document", async () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const doc = frame.contentDocument!;
    const ownerWindow = frame.contentWindow!;
    Object.defineProperty(ownerWindow, "innerWidth", { value: 390, configurable: true });
    Object.defineProperty(ownerWindow, "innerHeight", { value: 858, configurable: true });
    const { unmount } = render(<DevicePicker />, { container: doc.body });
    const anchor = within(doc.body).getByRole("button", { name: "Pick date" });
    const rect = vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue({ left: 20, right: 90, top: 200, bottom: 240, width: 70, height: 40, x: 20, y: 200, toJSON: () => ({}) });
    anchor.focus();
    fireEvent.click(anchor);
    const popup = await within(doc.body).findByRole("dialog", { name: "Date" });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await waitFor(() => expect(popup).toHaveStyle({ width: "340px", left: "12px", top: "248px" }));
    rect.mockReturnValue({ left: 20, right: 90, top: 300, bottom: 340, width: 70, height: 40, x: 20, y: 300, toJSON: () => ({}) });
    fireEvent.scroll(ownerWindow);
    expect(popup).toHaveStyle({ top: "348px" });
    const visibleViewport = Object.assign(new EventTarget(), { width: 320, height: 300, offsetLeft: 0, offsetTop: 0 });
    Object.defineProperty(ownerWindow, "visualViewport", { value: visibleViewport, configurable: true });
    // The shared placement subscribes to the viewport present when opening.
    fireEvent.keyDown(doc, { key: "Escape" });
    fireEvent.click(anchor);
    const keyboardPopup = await within(doc.body).findByRole("dialog", { name: "Date" });
    await waitFor(() => expect(keyboardPopup).toHaveStyle({ width: "296px", bottom: "570px", maxHeight: "276px" }));
    visibleViewport.height = 240;
    act(() => { visibleViewport.dispatchEvent(new Event("resize")); });
    expect(keyboardPopup).toHaveStyle({ bottom: "630px", maxHeight: "216px" });
    fireEvent.keyDown(doc, { key: "Escape" });
    expect(within(doc.body).queryByRole("dialog")).toBeNull();
    expect(doc.activeElement).toBe(anchor);
    unmount();
    frame.remove();
  });
});
