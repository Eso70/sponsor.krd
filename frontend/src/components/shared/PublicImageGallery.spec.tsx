import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicImageGallery } from "./PublicImageGallery";
import { imageMediaCopy } from "./image-media-copy";
import { FormPreviewHeader } from "@/features/forms/components/FormPreviewHeader";
import { createForm } from "@/features/forms/forms-model";
import { formsCopy } from "@/features/forms/forms-copy";
import { formEditorCopy } from "@/features/forms/form-editor-copy";

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
const images = ["/images/upload/first.png", "/images/upload/second.png"];
const copy = imageMediaCopy("en");
describe("shared banner carousel", () => {
  it("advances every three seconds, wraps and does not count automatic engagement", () => {
    vi.useFakeTimers();
    const change = vi.fn();
    const { container } = render(<PublicImageGallery banner carousel images={images} copy={copy} onSlideChange={change} />);
    const image = () => container.querySelector("img")!;
    act(() => vi.advanceTimersByTime(2999));
    expect(image()).toHaveAttribute("src", expect.stringContaining("first.png"));
    act(() => vi.advanceTimersByTime(1));
    expect(image()).toHaveAttribute("src", expect.stringContaining("second.png"));
    act(() => vi.advanceTimersByTime(3000));
    expect(image()).toHaveAttribute("src", expect.stringContaining("first.png"));
    expect(change).not.toHaveBeenCalled();
    fireEvent.focus(screen.getByRole("button", { name: "Preview: Banner image" }));
    act(() => vi.advanceTimersByTime(3000));
    expect(image()).toHaveAttribute("src", expect.stringContaining("first.png"));
    fireEvent.blur(screen.getByRole("button", { name: "Preview: Banner image" }), { relatedTarget: null });
    act(() => vi.advanceTimersByTime(3000));
    expect(image()).toHaveAttribute("src", expect.stringContaining("second.png"));
  });
  it("swipes both ways without opening the image and preserves vertical gestures", () => {
    const change = vi.fn(), open = vi.fn();
    const { container } = render(<PublicImageGallery banner carousel images={images} copy={copy} onSlideChange={change} onImageOpen={open} />);
    const gallery = container.firstChild!;
    const swipe = (x: number, y = 0) => {
      fireEvent.touchStart(gallery, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(gallery, { changedTouches: [{ clientX: x, clientY: 100 + y }] });
    };
    swipe(10);
    expect(change).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Preview: Banner image" }));
    expect(open).not.toHaveBeenCalled();
    swipe(190);
    expect(change).toHaveBeenLastCalledWith(0);
    swipe(90, 100);
    expect(change).toHaveBeenCalledTimes(2);
    expect(container.querySelector("img")).toHaveAttribute("src", expect.stringContaining("first.png"));
  });
  it("does not auto-advance single images or non-banner galleries", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<PublicImageGallery banner images={images} copy={copy} />);
    act(() => vi.advanceTimersByTime(9000));
    expect(container.querySelector("img")).toHaveAttribute("src", expect.stringContaining("first.png"));
    rerender(<PublicImageGallery carousel images={images} copy={copy} />);
    act(() => vi.advanceTimersByTime(9000));
    expect(container.querySelector("img")).toHaveAttribute("src", expect.stringContaining("first.png"));
  });
  it.each([false, true])("rotates the same Form banner in preview/public mode (%s)", (publicPage) => {
    vi.useFakeTimers();
    const form = { ...createForm("en"), bannerEnabled: true, bannerMode: "carousel" as const, bannerImages: images, logoEnabled: false };
    const { container } = render(<FormPreviewHeader form={form} copy={formsCopy("en")} labels={formEditorCopy("en")} placeholders={false} publicPage={publicPage} />);
    act(() => vi.advanceTimersByTime(3000));
    expect(container.querySelector('[data-form-media="banner"] img')).toHaveAttribute("src", expect.stringContaining("second.png"));
  });
  it("pauses in hidden tabs and restarts when visible", () => {
    vi.useFakeTimers();
    const hidden = vi.spyOn(document, "hidden", "get");
    const { container } = render(<PublicImageGallery banner carousel images={images} copy={copy} />);
    hidden.mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(6000));
    expect(container.querySelector("img")).toHaveAttribute("src", expect.stringContaining("first.png"));
    hidden.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(3000));
    expect(container.querySelector("img")).toHaveAttribute("src", expect.stringContaining("second.png"));
  });
});
