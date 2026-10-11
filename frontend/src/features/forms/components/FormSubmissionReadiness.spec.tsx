import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createForm, createQuestion } from "../forms-model";
import { FormPreview } from "./FormPreview";

describe("required answers before submitting", () => {
  it.each(["form", "card"] as const)(
    "disables Send until required fields and consent are valid in %s",
    async (layout) => {
      const submit = vi.fn().mockResolvedValue(undefined);
      const form = {
        ...createForm("en"),
        layout,
        questions: [
          {
            ...createQuestion("short"),
            id: "name",
            label: "Name",
            required: true,
            category: "user" as const,
          },
          {
            ...createQuestion("email"),
            id: "email",
            label: "Email",
            required: true,
            category: "user" as const,
          },
          {
            ...createQuestion("phone"),
            id: "phone",
            label: "Phone",
            required: true,
            category: "user" as const,
          },
          {
            ...createQuestion("short"),
            id: "optional",
            label: "Optional",
            required: false,
            category: "user" as const,
          },
        ],
      };
      render(<FormPreview form={form} onSubmit={submit} />);
      if (layout === "card")
        fireEvent.click(screen.getByRole("button", { name: "Start" }));
      const send = screen.getByRole("button", { name: "Send" });
      expect(send).toBeDisabled();
      fireEvent.click(send);
      expect(submit).not.toHaveBeenCalled();
      fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
        target: { value: "   " },
      });
      fireEvent.change(screen.getByRole("textbox", { name: "Email" }), {
        target: { value: "invalid" },
      });
      fireEvent.change(screen.getByRole("textbox", { name: "Phone" }), {
        target: { value: "1" },
      });
      expect(send).toBeDisabled();
      fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
        target: { value: "Person" },
      });
      fireEvent.change(screen.getByRole("textbox", { name: "Email" }), {
        target: { value: "person@example.com" },
      });
      fireEvent.change(screen.getByRole("textbox", { name: "Phone" }), {
        target: { value: "07501234567" },
      });
      expect(send).toBeEnabled();
      const consent = screen.getByRole("checkbox", {
        name: "I agree to the privacy policy",
      });
      fireEvent.click(consent);
      expect(send).toBeDisabled();
      fireEvent.click(consent);
      fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
        target: { value: "" },
      });
      expect(send).toBeDisabled();
      fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
        target: { value: "Person" },
      });
      fireEvent.click(send);
      await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    },
  );
});
