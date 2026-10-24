import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CursorGlow } from "./CursorGlow";

afterEach(() => { vi.restoreAllMocks(); document.body.style.removeProperty("cursor"); });

function setup(matches = true) {
  const remove = vi.fn();
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  document.body.style.cursor = "default";
  vi.spyOn(window, "matchMedia").mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: remove } as unknown as MediaQueryList);
  const frames = new Map<number, FrameRequestCallback>();
  let id = 0;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { frames.set(++id, callback); return id; });
  const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation((key) => { frames.delete(key); });
  const view = render(<CursorGlow />);
  const glow = view.container.firstElementChild as HTMLElement;
  const move = (x: number, type = "mouse") => {
    const event = new Event("pointermove", { bubbles: true });
    Object.assign(event, { clientX: x, clientY: 50, pointerType: type, buttons: 0 });
    fireEvent(document.body, event);
  };
  const tick = (time: number) => act(() => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(time));
  });
  return { ...view, glow, move, frames, tick, cancel, remove };
}

describe("shared decorative cursor movement", () => {
  it("trails movement, stops when settled and cleans up on exit/unmount", () => {
    const view = setup();
    view.move(10);
    expect(view.glow.style.opacity).toBe("1");
    view.tick(16);
    expect(view.frames.size).toBe(0);
    view.move(100);
    view.tick(32);
    expect(view.glow.style.transform).not.toContain("(100px");
    for (let time = 48; time < 1000; time += 16) view.tick(time);
    expect(view.frames.size).toBe(0);
    fireEvent.blur(window);
    expect(view.glow.style.opacity).toBe("0");
    view.move(150);
    view.unmount();
    expect(view.frames.size).toBe(0);
    expect(view.remove).toHaveBeenCalledWith("change", expect.any(Function));
    view.move(200);
    expect(view.frames.size).toBe(0);
  });

  it("does not animate with reduced motion or a coarse pointer", () => {
    const view = setup(false);
    view.move(10);
    expect(view.frames.size).toBe(0);
    expect(view.glow.style.opacity).toBe("0");
    view.unmount();
  });

  it("hides for touch and while pressing a control", () => {
    const view = setup();
    view.move(10);
    document.body.style.cursor = "text";
    view.move(15);
    expect(view.glow.style.opacity).toBe("0");
    document.body.style.cursor = "default";
    view.move(10);
    fireEvent.pointerDown(window);
    expect(view.glow.style.opacity).toBe("0");
    expect(view.frames.size).toBe(0);
    view.move(20, "touch");
    expect(view.frames.size).toBe(0);
    view.unmount();
  });
});
