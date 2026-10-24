import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditorBannerControls } from "./EditorBannerControls";
import { LinktreeBannerEditor } from "@/features/link-editor/components/LinktreeBannerEditor";
import { formsCopy } from "@/features/forms/forms-copy";
import { formEditorCopy } from "@/features/forms/form-editor-copy";

const images = [1, 2, 3, 4, 5].map((index) => `/images/upload/banner-${index}.png`);
const copy = formsCopy("en"), labels = formEditorCopy("en");
function Banner({ surface, initial = images, changed }: { surface: "form" | "linktree"; initial?: string[]; changed: (images: string[]) => void }) {
  const [items, setItems] = useState(initial);
  const change = (next: string[]) => { setItems(next); changed(next); };
  if (surface === "linktree") return <LinktreeBannerEditor banner={{ enabled: true, mode: "carousel", images: items }}
    onChange={(banner) => change(banner.images)} locale="en" open onToggle={vi.fn()} requestCrop={vi.fn()} />;
  return <EditorBannerControls mode="carousel" onModeChange={vi.fn()} images={items} onChange={change}
    label={copy.banner} hint="" copy={copy} labels={labels} />;
}
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("banner image ordering", () => {
  it.each(["form", "linktree"] as const)("moves the first image to the fifth in the %s banner", (surface) => {
    vi.stubGlobal("PointerEvent", MouseEvent);
    vi.useFakeTimers();
    const changed = vi.fn();
    const { container } = render(<Banner surface={surface} changed={changed} />);
    const handle = screen.getByRole("button", { name: `${copy.preview} ${copy.banner} 1` });
    Object.assign(handle, { setPointerCapture: vi.fn(), hasPointerCapture: () => true, releasePointerCapture: vi.fn() });
    const target = container.querySelectorAll("[data-reorder-id]")[4];
    Object.defineProperty(document, "elementFromPoint", { configurable: true, value: vi.fn(() => target) });
    fireEvent.pointerDown(handle, { button: 0, clientX: 10, clientY: 10 });
    act(() => vi.advanceTimersByTime(250));
    fireEvent.pointerMove(handle, { clientX: 250, clientY: 10 });
    fireEvent.pointerUp(handle);
    expect(changed).toHaveBeenCalledExactlyOnceWith([...images.slice(1), images[0]]);
    const thumbnails = container.querySelectorAll('[data-reorder-id] img');
    expect(thumbnails[4]).toHaveAttribute("src", images[0]);
    expect(document.documentElement).not.toHaveAttribute("data-reorder-dragging");
    fireEvent.click(handle);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("keeps keyboard focus on the moving image and supports successive moves", () => {
    const changed = vi.fn();
    render(<Banner surface="form" changed={changed} />);
    const handle = screen.getByRole("button", { name: `${copy.preview} ${copy.banner} 1` });
    handle.focus();
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(handle).toHaveFocus();
    expect(handle).toHaveAttribute("aria-label", `${copy.preview} ${copy.banner} 2`);
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(changed).toHaveBeenLastCalledWith([images[1], images[2], images[0], images[3], images[4]]);
    expect(handle).toHaveFocus();
  });
  it("preserves duplicate URLs and excludes empty upload slots from dragging", () => {
    const changed = vi.fn();
    const { container } = render(<Banner surface="form" initial={[images[0], images[0], images[2]]} changed={changed} />);
    expect(container.querySelectorAll("[data-reorder-id]")).toHaveLength(3);
    fireEvent.keyDown(screen.getByRole("button", { name: `${copy.preview} ${copy.banner} 3` }), { key: "ArrowUp" });
    expect(changed).toHaveBeenCalledWith([images[0], images[2], images[0]]);
  });
  it("keeps actions off the image and allows a normal click to open a single carousel image", async () => {
    const { container } = render(<Banner surface="linktree" initial={[images[0]]} changed={vi.fn()} />);
    const thumbnail = screen.getByRole("button", { name: `${copy.preview} ${copy.banner} 1` });
    expect(thumbnail).not.toBeDisabled();
    expect(thumbnail.querySelector("button")).toBeNull();
    expect(container.querySelector('[data-reorder-id]')?.querySelectorAll("button")).toHaveLength(4);
    expect(screen.queryByRole("button", { name: new RegExp(labels.reorder) })).not.toBeInTheDocument();
    fireEvent.click(thumbnail);
    expect(await screen.findByRole("dialog", { name: copy.banner })).toBeInTheDocument();
  });
});
