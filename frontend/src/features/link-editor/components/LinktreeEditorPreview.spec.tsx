import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { TemplateComponentProps } from "@/components/templates/types";
import { LinktreeEditorPreview } from "./LinktreeEditorPreview";
import type { LinktreeEditorPreviewDraft } from "../editor-preview";

vi.mock("@/components/shared/PhoneMockup", () => ({ PhoneMockup: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/templates/DynamicTemplate", () => ({
  DynamicTemplate: ({ linktree }: TemplateComponentProps) => <>
    <p>{linktree.name}</p><p>{String(linktree.template_config?.templateKey)}</p>
    <a href="https://example.com">Visit</a><a href="https://wa.me/9647501234567">WhatsApp</a><button onClick={() => window.open("https://example.com")}>Preview action</button>
  </>
}));
const draft: LinktreeEditorPreviewDraft = { name: "First name", subtitle: "", subtitleColor: "", description: "", slug: "", image: null, backgroundColor: "#ffffff", templateKey: "spectrum", templateConfig: {}, socialLinks: [] };

describe("live Linktree preview", () => {
  it("updates through the existing template contract while containing navigation", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const { rerender } = render(<LinktreeEditorPreview draft={draft} locale="en" label="Preview" />);
    expect(screen.getByText("First name")).toBeInTheDocument();
    expect(fireEvent.click(screen.getByRole("link", { name: "Visit" }), { ctrlKey: true })).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Preview action" }));
    expect(open).not.toHaveBeenCalled();
    rerender(<LinktreeEditorPreview draft={{ ...draft, name: "Edited name", templateKey: "aurora" }} locale="en" label="Preview" />);
    expect(screen.getByText("Edited name")).toBeInTheDocument();
    expect(screen.getByText("aurora")).toBeInTheDocument();
    open.mockRestore();
  });
  it("previews draft questions and contains WhatsApp navigation", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const onClose = vi.fn();
    const whatsappPreview = { enabled: true, open: false, title: "Talk to us", subtitle: "Choose a topic", backgroundColor: "#123456",
      questions: [{ id: "order", text: "Order a product", message: "My order" }], onClose };
    const { rerender } = render(<LinktreeEditorPreview draft={draft} locale="en" label="Preview" whatsappPreview={whatsappPreview} />);
    fireEvent.click(screen.getByRole("link", { name: "WhatsApp" }));
    expect(screen.getByRole("dialog", { name: "Talk to us" })).toBeInTheDocument();
    expect(screen.getByRole("dialog").style.getPropertyValue("--picker-surface")).toBe("#123456");
    fireEvent.click(screen.getByRole("button", { name: "Order a product" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(open).not.toHaveBeenCalled();
    rerender(<LinktreeEditorPreview draft={draft} locale="en" label="Preview" whatsappPreview={{ ...whatsappPreview, open: true, title: "Edited title", backgroundColor: "#ffffff" }} />);
    expect(screen.getByRole("dialog", { name: "Edited title" })).toBeInTheDocument();
    expect(screen.getByRole("dialog").style.getPropertyValue("--picker-surface")).toBe("#ffffff");
    open.mockRestore();
  });
});
