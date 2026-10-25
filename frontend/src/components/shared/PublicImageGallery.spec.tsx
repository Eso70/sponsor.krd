import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicImageGallery } from "./PublicImageGallery";
import { imageMediaCopy } from "./image-media-copy";
import { FormPreviewHeader } from "@/features/forms/components/FormPreviewHeader";
import { createForm } from "@/features/forms/forms-model";
import { formsCopy } from "@/features/forms/forms-copy";
import { formEditorCopy } from "@/features/forms/form-editor-copy";

class MousePointer extends MouseEvent {
  readonly pointerId: number;
  readonly pointerType: string;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
    this.pointerType = init.pointerType ?? "mouse";
  }
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const images = ["/images/upload/first.png", "/images/upload/second.png"];
const copy = imageMediaCopy("en");
describe("shared banner carousel", () => {
  it("advances every three seconds, wraps and does not count automatic engagement", () => {
    vi.useFakeTimers();
    const change = vi.fn();
    const { container } = render(
      <PublicImageGallery
        banner
        carousel
        images={images}
        copy={copy}
        onSlideChange={change}
      />,
    );
    const image = () =>
      container.querySelector(
        "[data-current-slide=true] img, [data-image-preview-trigger] > img",
      )!;
    act(() => vi.advanceTimersByTime(2999));
    expect(image()).toHaveAttribute(
      "src",
      expect.stringContaining("first.png"),
    );
    act(() => vi.advanceTimersByTime(1));
    expect(image()).toHaveAttribute(
      "src",
      expect.stringContaining("second.png"),
    );
    act(() => vi.advanceTimersByTime(3000));
    expect(image()).toHaveAttribute(
      "src",
      expect.stringContaining("first.png"),
    );
    expect(change).not.toHaveBeenCalled();
    fireEvent.focus(
      screen.getByRole("button", { name: "Preview: Banner image" }),
    );
    act(() => vi.advanceTimersByTime(3000));
    expect(image()).toHaveAttribute(
      "src",
      expect.stringContaining("first.png"),
    );
    fireEvent.blur(
      screen.getByRole("button", { name: "Preview: Banner image" }),
      { relatedTarget: null },
    );
    act(() => vi.advanceTimersByTime(3000));
    expect(image()).toHaveAttribute(
      "src",
      expect.stringContaining("second.png"),
    );
  });
  it.each(["mouse", "touch"] as const)(
    "loops through both edges with %s and resets invisibly",
    (input) => {
      vi.stubGlobal("PointerEvent", MousePointer);
      vi.useFakeTimers();
      const change = vi.fn();
      const { container } = render(
        <PublicImageGallery
          banner
          carousel
          images={images}
          copy={copy}
          onSlideChange={change}
        />,
      );
      const gallery = container.firstChild!;
      const swipe = (end: number) => {
        if (input === "mouse") {
          const trigger = screen.getByRole("button", {
            name: "Preview: Banner image",
          });
          fireEvent.pointerDown(trigger, {
            button: 0,
            clientX: 100,
            clientY: 100,
          });
          fireEvent.pointerMove(trigger, { clientX: end, clientY: 100 });
          fireEvent.pointerUp(trigger, { clientX: end, clientY: 100 });
          return;
        }
        fireEvent.touchStart(gallery, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchEnd(gallery, {
          changedTouches: [{ clientX: end, clientY: 100 }],
        });
      };
      const active = () =>
        container.querySelector('[data-current-slide="true"]')!;
      swipe(190);
      expect(change).toHaveBeenLastCalledWith(1);
      expect(active()).toBe(active().parentElement!.firstElementChild);
      expect(active().querySelector("img")).toHaveAttribute(
        "src",
        expect.stringContaining("second.png"),
      );
      act(() => vi.advanceTimersByTime(400));
      expect(active()).not.toBe(active().parentElement!.firstElementChild);
      act(() => vi.advanceTimersByTime(40));
      swipe(10);
      expect(change).toHaveBeenLastCalledWith(0);
      expect(active()).toBe(active().parentElement!.lastElementChild);
      act(() => vi.advanceTimersByTime(400));
      expect(active()).not.toBe(active().parentElement!.lastElementChild);
      expect(change).toHaveBeenCalledTimes(2);
    },
  );
  it("uses dots instead of arrows and reports a manual selection once", () => {
    const change = vi.fn();
    const { container } = render(
      <PublicImageGallery
        banner
        carousel
        images={images}
        copy={copy}
        onSlideChange={change}
      />,
    );
    expect(
      screen.queryByRole("button", { name: copy.next }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.back }),
    ).not.toBeInTheDocument();
    const first = screen.getByRole("button", { name: "Banner image 1 / 2" });
    const second = screen.getByRole("button", { name: "Banner image 2 / 2" });
    expect(first).toHaveAttribute("aria-current", "true");
    fireEvent.click(second);
    expect(second).toHaveAttribute("aria-current", "true");
    expect(first).not.toHaveAttribute("aria-current");
    expect(change).toHaveBeenCalledExactlyOnceWith(1);
    expect(container.querySelector('[data-current-slide="true"]')).toHaveStyle({
      transform: "translateX(0%)",
    });
    fireEvent.click(second);
    expect(change).toHaveBeenCalledTimes(1);
  });
  it("drags with the mouse in either direction without opening the image", () => {
    vi.stubGlobal("PointerEvent", MousePointer);
    const change = vi.fn(),
      open = vi.fn();
    const { container } = render(
      <PublicImageGallery
        banner
        carousel
        images={images}
        copy={copy}
        onSlideChange={change}
        onImageOpen={open}
      />,
    );
    const trigger = screen.getByRole("button", {
      name: "Preview: Banner image",
    });
    const capture = vi.fn(),
      release = vi.fn();
    Object.assign(trigger, {
      setPointerCapture: capture,
      hasPointerCapture: () => true,
      releasePointerCapture: release,
    });
    const drag = (end: number) => {
      fireEvent.pointerDown(trigger, { button: 0, clientX: 100, clientY: 100 });
      fireEvent.pointerMove(trigger, { clientX: end, clientY: 100 });
      expect(
        container.querySelector('[data-current-slide="true"]'),
      ).toHaveStyle({ transform: `translateX(calc(0% + ${end - 100}px))` });
      fireEvent.pointerUp(trigger, { clientX: end, clientY: 100 });
      fireEvent.click(trigger);
    };
    drag(10);
    expect(change).toHaveBeenLastCalledWith(1);
    drag(190);
    expect(change).toHaveBeenLastCalledWith(0);
    expect(change).toHaveBeenCalledTimes(2);
    expect(open).not.toHaveBeenCalled();
    expect(capture).toHaveBeenCalledTimes(2);
    expect(release).toHaveBeenCalledTimes(2);
    fireEvent.pointerDown(trigger, { button: 0, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(trigger, { clientX: 100, clientY: 100 });
    fireEvent.click(trigger);
    expect(open).toHaveBeenCalledExactlyOnceWith(0);
  });
  it("swipes both ways without opening the image and preserves vertical gestures", () => {
    const change = vi.fn(),
      open = vi.fn();
    const { container } = render(
      <PublicImageGallery
        banner
        carousel
        images={images}
        copy={copy}
        onSlideChange={change}
        onImageOpen={open}
      />,
    );
    const gallery = container.firstChild!;
    const swipe = (x: number, y = 0) => {
      fireEvent.touchStart(gallery, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchEnd(gallery, {
        changedTouches: [{ clientX: x, clientY: 100 + y }],
      });
    };
    swipe(10);
    expect(change).toHaveBeenLastCalledWith(1);
    fireEvent.click(
      screen.getByRole("button", { name: "Preview: Banner image" }),
    );
    expect(open).not.toHaveBeenCalled();
    swipe(190);
    expect(change).toHaveBeenLastCalledWith(0);
    swipe(90, 100);
    expect(change).toHaveBeenCalledTimes(2);
    expect(
      container.querySelector(
        "[data-current-slide=true] img, [data-image-preview-trigger] > img",
      ),
    ).toHaveAttribute("src", expect.stringContaining("first.png"));
  });
  it("does not auto-advance single images or non-banner galleries", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <PublicImageGallery banner images={images} copy={copy} />,
    );
    act(() => vi.advanceTimersByTime(9000));
    expect(
      container.querySelector(
        "[data-current-slide=true] img, [data-image-preview-trigger] > img",
      ),
    ).toHaveAttribute("src", expect.stringContaining("first.png"));
    rerender(<PublicImageGallery carousel images={images} copy={copy} />);
    act(() => vi.advanceTimersByTime(9000));
    expect(
      container.querySelector(
        "[data-current-slide=true] img, [data-image-preview-trigger] > img",
      ),
    ).toHaveAttribute("src", expect.stringContaining("first.png"));
  });
  it.each([false, true])(
    "rotates the same Form banner in preview/public mode (%s)",
    (publicPage) => {
      vi.useFakeTimers();
      const form = {
        ...createForm("en"),
        bannerEnabled: true,
        bannerMode: "carousel" as const,
        bannerImages: images,
        logoEnabled: false,
      };
      const { container } = render(
        <FormPreviewHeader
          form={form}
          copy={formsCopy("en")}
          labels={formEditorCopy("en")}
          placeholders={false}
          publicPage={publicPage}
        />,
      );
      act(() => vi.advanceTimersByTime(3000));
      expect(
        container.querySelector(
          '[data-form-media="banner"] [data-current-slide=true] img',
        ),
      ).toHaveAttribute("src", expect.stringContaining("second.png"));
    },
  );
  it("pauses in hidden tabs and restarts when visible", () => {
    vi.useFakeTimers();
    const hidden = vi.spyOn(document, "hidden", "get");
    const { container } = render(
      <PublicImageGallery banner carousel images={images} copy={copy} />,
    );
    hidden.mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(6000));
    expect(
      container.querySelector(
        "[data-current-slide=true] img, [data-image-preview-trigger] > img",
      ),
    ).toHaveAttribute("src", expect.stringContaining("first.png"));
    hidden.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(3000));
    expect(
      container.querySelector(
        "[data-current-slide=true] img, [data-image-preview-trigger] > img",
      ),
    ).toHaveAttribute("src", expect.stringContaining("second.png"));
  });
});
