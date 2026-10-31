import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LinktreeQuestionsEditor } from "./LinktreeQuestionsEditor";
import { englishEditorCopy } from "../editor-copy";
import { formEditorCopy } from "@/features/forms/form-editor-copy";
import type { WhatsAppQuestion } from "@/components/public/WhatsAppQuestionModal";

const questions = [
  { id: "order", text: "Place an order", message: "Order message", videoUrl: "https://youtu.be/abc" },
  { id: "price", text: "Ask for price", message: "Price message" },
];
function Editor({ onChange }: { onChange: (questions: WhatsAppQuestion[]) => void }) {
  const [items, setItems] = useState(questions);
  return <LinktreeQuestionsEditor copy={englishEditorCopy} whatsappModalEnabled whatsappModalTitle="Contact" whatsappModalSubtitle="Choose"
    whatsappModalBackgroundColor="#ffffff" onWhatsappModalBackgroundColorChange={vi.fn()}
    whatsappQuestions={items} onWhatsappModalTitleChange={vi.fn()} onWhatsappModalSubtitleChange={vi.fn()}
    onWhatsappQuestionsChange={(next) => { setItems(next); onChange(next); }} />;
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("WhatsApp question ordering", () => {
  it.each(["without randomUUID", "without Web Crypto"])("adds unique questions %s", runtime => {
    const cryptoApi = globalThis.crypto;
    vi.stubGlobal("crypto", runtime === "without Web Crypto" ? undefined : { getRandomValues: cryptoApi.getRandomValues.bind(cryptoApi) });
    const change = vi.fn();
    render(<Editor onChange={change} />);
    fireEvent.click(screen.getByRole("button", { name: englishEditorCopy.addQuestion }));
    fireEvent.click(screen.getByRole("button", { name: englishEditorCopy.addQuestion }));
    const added = change.mock.lastCall![0] as WhatsAppQuestion[];
    expect(added).toHaveLength(4);
    expect(added.slice(0, 2)).toEqual(questions);
    for (const question of added.slice(2)) {
      expect(question.id).toMatch(/^question_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(question.text).toBe("");
      expect(question.message).toBe("");
    }
    expect(new Set(added.map(question => question.id)).size).toBe(4);
  });
  it("moves with arrow keys while preserving messages and keeping boundary moves unchanged", () => {
    const change = vi.fn();
    const { container } = render(<Editor onChange={change} />);
    const handle = screen.getByRole("button", { name: `${formEditorCopy("en").reorder} Question 1` });
    fireEvent.keyDown(handle, { key: "ArrowUp" });
    expect(change).not.toHaveBeenCalled();
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(change).toHaveBeenCalledExactlyOnceWith([questions[1], questions[0]]);
    expect(Array.from(container.querySelectorAll("[data-reorder-id]")).map((item) => item.getAttribute("data-reorder-id"))).toEqual(["price", "order"]);
    expect(screen.getByDisplayValue("Order message")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://youtu.be/abc")).toBeInTheDocument();
  });
  it("drags onto another question and clears the drag feedback", () => {
    vi.stubGlobal("PointerEvent", MouseEvent);
    const change = vi.fn();
    const { container } = render(<Editor onChange={change} />);
    const handle = screen.getByRole("button", { name: `${formEditorCopy("en").reorder} Question 1` });
    Object.assign(handle, { setPointerCapture: vi.fn(), hasPointerCapture: () => true, releasePointerCapture: vi.fn() });
    const target = container.querySelector('[data-reorder-id="price"]')!;
    const hit = vi.fn(() => target);
    Object.defineProperty(document, "elementFromPoint", { configurable: true, value: hit });
    fireEvent.pointerDown(handle, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(handle, { clientX: 10, clientY: 60 });
    expect(target).toHaveAttribute("data-reorder-target", "true");
    fireEvent.pointerUp(handle);
    expect(change).toHaveBeenCalledExactlyOnceWith([questions[1], questions[0]]);
    expect(document.documentElement).not.toHaveAttribute("data-reorder-dragging");
  });
});
