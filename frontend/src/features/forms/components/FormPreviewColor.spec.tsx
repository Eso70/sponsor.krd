import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormBuilder } from "./FormBuilder";
import { FormPreview } from "./FormPreview";
import { createForm } from "../forms-model";
import { formsCopy } from "../forms-copy";

function preview() {
  return document.querySelector<HTMLElement>("[data-form-preview]")!;
}

describe("Form preview color", () => {
  it("persists the chosen gradient and uses it on both preview tabs", async () => {
    const onChange = vi.fn();
    render(
      <FormBuilder
        form={createForm("en")}
        onChange={onChange}
        copy={formsCopy("en")}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Color" }));
    const picker = await screen.findByRole("dialog", { name: "Color" });
    expect(picker).not.toHaveAttribute("aria-modal", "true");
    expect(picker).not.toHaveClass("top-1/2");
    fireEvent.click(within(picker).getByRole("button", { name: "Gradient" }));
    fireEvent.click(within(picker).getByRole("button", { name: "#8b5cf6" }));
    fireEvent.click(
      within(picker).getByRole("button", { name: "Second color" }),
    );
    fireEvent.click(within(picker).getByRole("button", { name: "#3b82f6" }));
    fireEvent.click(
      within(picker).getByRole("button", { name: "Left to right" }),
    );
    fireEvent.click(within(picker).getByRole("button", { name: "Apply" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Color" }),
      ).not.toBeInTheDocument(),
    );
    expect(preview().style.getPropertyValue("--preview-accent-fill")).toBe(
      "linear-gradient(to right, #8b5cf6 0%, #3b82f6 100%)",
    );
    fireEvent.click(screen.getByRole("tab", { name: "Final page" }));
    expect(preview().style.getPropertyValue("--preview-accent")).toBe(
      "#8b5cf6",
    );
    expect(onChange).toHaveBeenCalledWith({
      color: "gradient:to-r:#8b5cf6:#3b82f6",
    });
  });

  it("cancels uncommitted color edits with Escape and restores the trigger focus", async () => {
    render(
      <FormBuilder
        form={createForm("en")}
        onChange={vi.fn()}
        copy={formsCopy("en")}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Color" });
    trigger.focus();
    fireEvent.click(trigger);
    const picker = await screen.findByRole("dialog", { name: "Color" });
    fireEvent.click(within(picker).getByRole("button", { name: "#3b82f6" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByRole("dialog", { name: "Color" }),
    ).not.toBeInTheDocument();
    expect(preview().style.getPropertyValue("--preview-accent")).toBe(
      "#ef4444",
    );
    expect(trigger).toHaveFocus();
  });

  it("dismisses the popup on an outside click without applying edits", async () => {
    render(
      <FormBuilder
        form={createForm("en")}
        onChange={vi.fn()}
        copy={formsCopy("en")}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Color" }));
    const picker = await screen.findByRole("dialog", { name: "Color" });
    fireEvent.click(within(picker).getByRole("button", { name: "#3b82f6" }));
    fireEvent.pointerDown(document.body);
    expect(
      screen.queryByRole("dialog", { name: "Color" }),
    ).not.toBeInTheDocument();
    expect(preview().style.getPropertyValue("--preview-accent")).toBe(
      "#ef4444",
    );
  });

  it("uses readable ink for pale colors and rejects arbitrary CSS", () => {
    const form = createForm("en");
    const view = render(<FormPreview form={form} color="#fff" />);
    expect(preview().style.getPropertyValue("--preview-accent-ink")).toBe(
      "#111827",
    );
    view.rerender(
      <FormPreview
        form={form}
        color="url(https://example.com/image)"
        appearance="dark"
      />,
    );
    expect(preview()).toHaveAttribute("data-appearance", "dark");
    expect(preview().style.getPropertyValue("--preview-accent-fill")).toBe(
      "#16a34a",
    );
  });
});
