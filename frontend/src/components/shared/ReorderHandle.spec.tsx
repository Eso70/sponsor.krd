import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReorderHandle } from "./ReorderHandle";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("ReorderHandle", () => {
  it("supports keyboard moves without toggling its accordion", () => {
    const step = vi.fn();
    render(
      <details open>
        <summary>
          <ReorderHandle
            id="one"
            group="custom"
            label="Reorder"
            onReorder={vi.fn()}
            onStep={step}
          />
        </summary>
      </details>,
    );
    const handle = screen.getByRole("button", { name: "Reorder" });
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(step).toHaveBeenCalledWith(1);
    fireEvent.click(handle);
    expect(handle.closest("details")).toHaveAttribute("open");
  });
  it("drops only onto rows in its group and clears canceled highlighting", () => {
    vi.stubGlobal("PointerEvent", MouseEvent);
    const reorder = vi.fn();
    render(
      <>
        <ReorderHandle
          id="one"
          group="custom"
          label="Reorder"
          onReorder={reorder}
          onStep={vi.fn()}
        />
        <div data-reorder-id="two" data-reorder-group="custom">
          Target
        </div>
        <div data-reorder-id="other" data-reorder-group="personal">
          Other
        </div>
      </>,
    );
    const handle = screen.getByRole("button", { name: "Reorder" });
    Object.assign(handle, {
      setPointerCapture: vi.fn(),
      hasPointerCapture: () => true,
      releasePointerCapture: vi.fn(),
    });
    const target = screen.getByText("Target");
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: vi.fn(() => target),
    });
    fireEvent.pointerDown(handle, { button: 0, clientX: 10, clientY: 10 });
    expect(document.documentElement).toHaveAttribute(
      "data-reorder-dragging",
      "one",
    );
    fireEvent.pointerMove(handle, { clientX: 10, clientY: 50 });
    expect(target).toHaveAttribute("data-reorder-target", "true");
    fireEvent.pointerUp(handle);
    expect(reorder).toHaveBeenCalledWith("one", "two");
    expect(document.documentElement).not.toHaveAttribute(
      "data-reorder-dragging",
    );
    expect(target).not.toHaveAttribute("data-reorder-target");
    fireEvent.pointerDown(handle, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(handle, { clientX: 10, clientY: 50 });
    fireEvent.pointerCancel(handle);
    expect(document.documentElement).not.toHaveAttribute(
      "data-reorder-dragging",
    );
    expect(target).not.toHaveAttribute("data-reorder-target");
    vi.mocked(document.elementFromPoint).mockReturnValue(
      screen.getByText("Other"),
    );
    fireEvent.pointerDown(handle, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(handle, { clientX: 10, clientY: 50 });
    fireEvent.pointerUp(handle);
    expect(reorder).toHaveBeenCalledTimes(1);
  });
  it("clears held feedback on cancel, lost capture and unmount", () => {
    vi.stubGlobal("PointerEvent", MouseEvent);
    const { unmount } = render(
      <section data-reorder-id="one" data-reorder-group="sections">
        <ReorderHandle
          id="one"
          group="sections"
          label="Hold"
          onReorder={vi.fn()}
          onStep={vi.fn()}
        />
      </section>,
    );
    const handle = screen.getByRole("button", { name: "Hold" });
    Object.assign(handle, { setPointerCapture: vi.fn() });
    const section = handle.closest("section")!;
    for (const event of ["pointerCancel", "lostPointerCapture"] as const) {
      fireEvent.pointerDown(handle, { button: 0, clientX: 10, clientY: 10 });
      expect(section).toHaveAttribute("data-reorder-held", "true");
      fireEvent[event](handle);
      expect(section).not.toHaveAttribute("data-reorder-held");
      expect(document.documentElement).not.toHaveAttribute(
        "data-reorder-dragging",
      );
    }
    fireEvent.pointerDown(handle, { button: 0, clientX: 10, clientY: 10 });
    unmount();
    expect(section).not.toHaveAttribute("data-reorder-held");
    expect(document.documentElement).not.toHaveAttribute(
      "data-reorder-dragging",
    );
  });
});
