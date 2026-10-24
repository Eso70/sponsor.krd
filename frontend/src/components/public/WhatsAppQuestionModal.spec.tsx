import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WhatsAppQuestionModal } from "./WhatsAppQuestionModal";
import { PublicLinktreeLocaleProvider } from "@/features/business/i18n/public-linktree";

describe("WhatsApp question dialog", () => {
  it.each(["en", "ar", "ckb"] as const)("preserves question messages in %s with a dark surface", (locale) => {
    const select = vi.fn(), close = vi.fn();
    render(<PublicLinktreeLocaleProvider locale={locale}><WhatsAppQuestionModal isOpen appearance="dark" accentColor="#e35767"
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
    fireEvent.keyDown(dialog, { key: "Escape" });
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
    expect(select).toHaveBeenCalledWith("I'd like this item\n\nhttps://youtu.be/abc", expect.objectContaining({ id: "video" }));
  });
});
