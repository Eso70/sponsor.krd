import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WhatsAppQuestionModal } from "./WhatsAppQuestionModal";
import { PublicLinktreeLocaleProvider } from "@/features/business/i18n/public-linktree";

describe("WhatsApp question dialog", () => {
  it("closes on outside touch release before the delayed click and prevents tap-through", () => {
    const close = vi.fn(() => expect(dialog.open).toBe(false));
    render(<WhatsAppQuestionModal isOpen onClose={close} onSelectQuestion={vi.fn()} whatsappUrl="" />);
    const dialog = screen.getByRole("dialog") as HTMLDialogElement;
    const touch = { identifier: 1, clientX: -10, clientY: -10 };
    fireEvent.touchStart(dialog, { touches: [touch] });
    expect(close).not.toHaveBeenCalled();
    const uncancelled = fireEvent.touchEnd(dialog, { touches: [], changedTouches: [touch] });
    expect(uncancelled).toBe(false);
    expect(close).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(dialog, { clientX: -10, clientY: -10 });
    expect(close).toHaveBeenCalledOnce();
  });
  it.each(["inside", "drag", "cancel", "multitouch"])("does not dismiss a %s touch gesture", gesture => {
    const close = vi.fn();
    render(<WhatsAppQuestionModal isOpen onClose={close} onSelectQuestion={vi.fn()} whatsappUrl="" />);
    const dialog = screen.getByRole("dialog");
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ left: 100, top: 100, right: 300, bottom: 300, width: 200, height: 200, x: 100, y: 100, toJSON: () => ({}) });
    const outside = { identifier: 1, clientX: 50, clientY: 50 };
    const inside = { identifier: 1, clientX: 150, clientY: 150 };
    fireEvent.touchStart(dialog, { touches: [gesture === "inside" ? inside : outside] });
    if (gesture === "drag") fireEvent.touchMove(dialog, { touches: [{ ...outside, clientY: 80 }] });
    if (gesture === "cancel") fireEvent.touchCancel(dialog);
    if (gesture === "multitouch") fireEvent.touchStart(dialog, { touches: [outside, { ...outside, identifier: 2 }] });
    fireEvent.touchEnd(dialog, { touches: [], changedTouches: [outside] });
    expect(close).not.toHaveBeenCalled();
    expect(dialog).toHaveAttribute("open");
  });
  it("focuses the panel rather than leaving the close button active on opening", () => {
    const nativeOpen = vi.spyOn(HTMLDialogElement.prototype, "showModal").mockImplementation(function (this: HTMLDialogElement) {
      this.open = true;
      this.querySelector("button")?.focus();
    });
    try {
      render(<PublicLinktreeLocaleProvider locale="en"><WhatsAppQuestionModal isOpen onClose={vi.fn()} onSelectQuestion={vi.fn()} whatsappUrl="" /></PublicLinktreeLocaleProvider>);
      expect(screen.getByRole("dialog")).toHaveFocus();
      expect(screen.getByRole("button", { name: "Close" })).not.toHaveFocus();
    } finally { nativeOpen.mockRestore(); }
  });
  it("defaults to its own white surface inside a dark page", () => {
    render(<div className="dark" style={{ "--shared-control-text": "red" } as import("react").CSSProperties}>
      <WhatsAppQuestionModal isOpen onClose={vi.fn()} onSelectQuestion={vi.fn()} whatsappUrl="" />
    </div>);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("data-appearance", "light");
    expect(dialog.style.getPropertyValue("--picker-surface")).toBe("#ffffff");
    expect(dialog.style.getPropertyValue("--shared-control-text")).toBe("#1f2937");
  });
  it.each([ ["#abc", "#aabbcc", "light"], ["#123456", "#123456", "dark"] ])("uses an authored panel color %s with readable controls", (backgroundColor, normalized, appearance) => {
    render(<WhatsAppQuestionModal isOpen backgroundColor={backgroundColor} onClose={vi.fn()} onSelectQuestion={vi.fn()} whatsappUrl="" />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.style.getPropertyValue("--picker-surface")).toBe(normalized);
    expect(dialog).toHaveAttribute("data-appearance", appearance);
  });
  it.each(["en", "ar", "ckb"] as const)("preserves question messages in %s with a dark surface", (locale) => {
    const select = vi.fn(), close = vi.fn();
    render(<PublicLinktreeLocaleProvider locale={locale}><WhatsAppQuestionModal isOpen backgroundColor="#161b22"
      onClose={close} onSelectQuestion={select} whatsappUrl="https://wa.me/9647501234567"
      questions={[{ id: "saved", text: "Saved question", message: "Saved message" }]} /></PublicLinktreeLocaleProvider>);
    expect(screen.getByRole("dialog")).toHaveAttribute("data-appearance", "dark");
    fireEvent.click(screen.getByRole("button", { name: "Saved question" }));
    expect(select).toHaveBeenCalledExactlyOnceWith("Saved message", expect.objectContaining({ id: "saved", text: "Saved question" }));
    expect(close).toHaveBeenCalledOnce();
  });
  it("identifies questions even when their message bodies are identical", () => {
    const select = vi.fn();
    render(<WhatsAppQuestionModal isOpen onClose={vi.fn()} onSelectQuestion={select} whatsappUrl="" questions={[{ id:"first",text:"First choice",message:"Same message" },{ id:"second",text:"Second choice",message:"Same message" }]} />);
    fireEvent.click(screen.getByRole("button",{name:"Second choice"}));
    expect(select).toHaveBeenCalledWith("Same message",expect.objectContaining({id:"second"}));
  });

  it("restores an existing scroll lock and does not pick a question on Enter", () => {
    document.body.style.overflow = "hidden";
    const select = vi.fn(), close = vi.fn();
    const { unmount } = render(<WhatsAppQuestionModal isOpen onClose={close} onSelectQuestion={select} whatsappUrl="" />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveFocus();
    fireEvent.keyDown(dialog, { key: "Enter" });
    expect(select).not.toHaveBeenCalled();
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(close).toHaveBeenCalledOnce();
    unmount();
    expect(document.body.style.overflow).toBe("hidden");
    document.body.style.overflow = "";
  });
  it("includes a saved video link in the selected message", () => {
    const select = vi.fn();
    render(<WhatsAppQuestionModal isOpen onClose={vi.fn()} onSelectQuestion={select} whatsappUrl=""
      questions={[{ id: "video", text: "Order this", message: "I'd like this item", videoUrl: "https://youtu.be/abc" }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Order this" }));
    expect(select).toHaveBeenCalledWith("https://youtu.be/abc\n\nI'd like this item", expect.objectContaining({ id: "video" }));
  });
  it("reopens cleanly and returns focus without retaining a scroll lock", () => {
    const close = vi.fn();
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const props = { onClose: close, onSelectQuestion: vi.fn(), whatsappUrl: "" };
    const { rerender, unmount } = render(<WhatsAppQuestionModal {...props} isOpen />);
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    rerender(<WhatsAppQuestionModal {...props} isOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
    rerender(<WhatsAppQuestionModal {...props} isOpen />);
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    unmount();
    expect(document.body.style.overflow).toBe("");
    trigger.remove();
  });
  it("does not dismiss when clicking its panel, but dismisses on its backdrop", () => {
    const close = vi.fn();
    render(<WhatsAppQuestionModal isOpen onClose={close} onSelectQuestion={vi.fn()} whatsappUrl="" />);
    fireEvent.click(screen.getByRole("heading"));
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("dialog"), { clientX: -1, clientY: -1 });
    expect(close).toHaveBeenCalledOnce();
  });
});
