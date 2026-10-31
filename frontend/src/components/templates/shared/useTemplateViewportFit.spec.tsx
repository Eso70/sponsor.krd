import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTemplateViewportFit } from "./useTemplateViewportFit";

function FitFixture() {
  const { viewportRef, frameRef, contentRef } = useTemplateViewportFit();
  return <div ref={viewportRef} style={{ paddingTop: 20, paddingBottom: 50 }}>
    <div ref={frameRef} data-testid="frame"><div ref={contentRef} data-testid="content">Content</div></div>
    <footer data-linktree-footer>Legal</footer>
  </div>;
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("template viewport fitting", () => {
  it("uses the visible mobile viewport, follows browser-bar resizing, and preserves pinch zoom", () => {
    vi.stubGlobal("innerHeight", 800);
    const visibleViewport = Object.assign(new EventTarget(), { height: 600, scale: 1 });
    vi.stubGlobal("visualViewport", visibleViewport);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(600);
    let nextFrame: FrameRequestCallback | undefined;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => { nextFrame = callback; return 1; });
    const { getByTestId, container, unmount } = render(<div data-theme-background style={{ minHeight: "800px" }}><div className="public-template-shell"><FitFixture /></div></div>);
    const shell = container.querySelector<HTMLElement>(".public-template-shell")!;
    expect(shell.style.getPropertyValue("--template-viewport-height")).toBe("600px");
    expect(getByTestId("frame").style.height).toBe("530px");
    expect(container.firstElementChild).toHaveStyle({ minHeight: "0" });
    visibleViewport.height = 700;
    act(() => { visibleViewport.dispatchEvent(new Event("resize")); nextFrame!(0); });
    expect(shell.style.getPropertyValue("--template-viewport-height")).toBe("700px");
    expect(getByTestId("frame").style.height).toBe("");
    visibleViewport.scale = 2;
    visibleViewport.height = 350;
    act(() => { visibleViewport.dispatchEvent(new Event("resize")); nextFrame!(0); });
    expect(shell.style.getPropertyValue("--template-viewport-height")).toBe("700px");
    expect(getByTestId("frame").style.height).toBe("");
    const background = container.firstElementChild as HTMLElement;
    unmount();
    expect(background.style.minHeight).toBe("800px");
    expect(shell.style.getPropertyValue("--template-viewport-height")).toBe("");
  });
  it("reserves footer space, fits overflow, and restores full size when space returns", () => {
    vi.stubGlobal("innerHeight", 700);
    let height = 700;
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
      return this.dataset.testid === "content" ? height : 0;
    });
    let nextFrame: FrameRequestCallback | undefined;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => { nextFrame = callback; return 1; });
    const { getByTestId } = render(<FitFixture />);
    expect(getByTestId("content").style.transform).toBe("scale(0.9)");
    expect(getByTestId("content").style.getPropertyValue("--template-fit-scale")).toBe("0.9");
    expect(getByTestId("frame").style.height).toBe("630px");

    height = 1200;
    act(() => { window.dispatchEvent(new Event("resize")); nextFrame!(0); });
    expect(getByTestId("content").style.transform).toBe("scale(0.85)");
    expect(getByTestId("frame").style.height).toBe("1020px");

    height = 400;
    act(() => { window.dispatchEvent(new Event("resize")); nextFrame!(0); });
    expect(getByTestId("content").style.transform).toBe("");
    expect(getByTestId("content").style.getPropertyValue("--template-fit-scale")).toBe("1");
    expect(getByTestId("frame").style.height).toBe("");
  });

  it("recalculates after content/footer changes and releases its observer on unmount", () => {
    vi.stubGlobal("innerHeight", 700);
    let height = 600;
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(() => height);
    let resize: ResizeObserverCallback | undefined;
    const disconnect = vi.fn();
    const observe = vi.fn();
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: ResizeObserverCallback) { resize = callback; }
      observe = observe;
      disconnect = disconnect;
    });
    let nextFrame: FrameRequestCallback | undefined;
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => { nextFrame = callback; return 1; });
    const { getByTestId, unmount } = render(<FitFixture />);
    expect(getByTestId("frame").dataset.fitted).toBe("false");
    expect(observe).toHaveBeenCalledTimes(3);
    height = 700;
    act(() => { resize!([], {} as ResizeObserver); resize!([], {} as ResizeObserver); nextFrame!(0); });
    expect(raf).toHaveBeenCalledOnce();
    expect(getByTestId("frame").dataset.fitted).toBe("true");
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
