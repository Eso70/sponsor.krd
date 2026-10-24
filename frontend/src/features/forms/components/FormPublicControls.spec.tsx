import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createForm, createQuestion } from "../forms-model";
import { formsCopy } from "../forms-copy";
import { FormPreview } from "./FormPreview";

describe("shared public form controls", () => {
  it.each(["form", "card"] as const)("uses white primary ink in %s public, device and embedded views", (layout) => {
    const form = { ...createForm("en"), layout };
    const { container, rerender } = render(<FormPreview form={form} presentation="public" color="#ffffff" />);
    expect(container.querySelector<HTMLElement>("[data-form-preview]")?.style.getPropertyValue("--preview-accent-ink")).toBe("#ffffff");
    rerender(<FormPreview form={form} viewport="device" color="#ef4444" />);
    expect(container.querySelector<HTMLElement>("[data-form-preview]")?.style.getPropertyValue("--preview-accent-ink")).toBe("#ffffff");
    rerender(<FormPreview form={form} color="#ffffff" />);
    expect(container.querySelector<HTMLElement>("[data-form-preview]")?.style.getPropertyValue("--preview-accent-ink")).toBe("#ffffff");
  });

  it("keeps radio requirements and submits the custom appointment date as ISO", async () => {
    const form = { ...createForm("en"), consentRequired: false, questions: [
      { ...createQuestion("choice"), id: "choice", label: "Service", options: ["Personal", "Business"] },
      { ...createQuestion("date"), id: "date", label: "Appointment date", description: "Choose a day" },
    ] };
    const submit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<FormPreview form={form} presentation="public" onSubmit={submit} />);
    const radio = screen.getByRole("radio", { name: "Business" });
    expect(radio).toBeRequired();
    expect(radio).toHaveAttribute("type", "radio");
    fireEvent.click(radio);
    expect(radio).toBeChecked();
    expect(screen.getByRole("radio", { name: "Personal" })).not.toBeChecked();
    const date = screen.getByRole("textbox", { name: "Appointment date" });
    expect(date).toBeRequired();
    expect(date).toHaveAccessibleDescription("Choose a day");
    expect(container.querySelector('input[type="date"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open Appointment date" }));
    const popup = await screen.findByRole("dialog", { name: "Appointment date" });
    expect(popup).toHaveAttribute("aria-modal", "false");
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.change(date, { target: { value: "26/12/25" } });
    fireEvent.blur(date);
    fireEvent.click(screen.getByRole("button", { name: formsCopy("en").submit }));
    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ answers: { choice: "Business", date: "2026-12-25" } })));
  });
});
