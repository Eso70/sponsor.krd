import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WhatsAppQuestionModal } from "./WhatsAppQuestionModal";
import { PublicLinktreeLocaleProvider } from "@/features/business/i18n/public-linktree";

describe("WhatsApp question dialog", () => {
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
