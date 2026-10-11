import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormPreview } from "./FormPreview";
import { createForm } from "../forms-model";
import { formsCopy } from "../forms-copy";
import { formEditorCopy } from "../form-editor-copy";
import { formText } from "../forms-localization";

describe("shared preview page arrows", () => {
  for (const layout of ["form", "card"] as const) {
    it.each(["en", "ar", "ckb"] as const)(
      `${layout} browses pages and retains answers in %s`,
      (language) => {
        const form = { ...createForm(language), layout };
        const labels = formEditorCopy(language);
        const copy = formsCopy(language);
        render(<FormPreview form={form} />);
        const previous = screen.getByRole("button", {
          name: labels.previousPreviewPage,
        });
        const next = screen.getByRole("button", {
          name: labels.nextPreviewPage,
        });
        expect(previous).toBeDisabled();
        if (layout === "card") fireEvent.click(next);
        const name = formText(
          form.questions[0].label,
          form.questions[0].labelKey,
          language,
        );
        fireEvent.change(screen.getByRole("textbox", { name }), {
          target: { value: "Visitor" },
        });
        // Preview arrows can review completion while required phone is still blank.
        fireEvent.click(next);
        expect(screen.getByText(copy.thankYou)).toBeInTheDocument();
        expect(next).toBeDisabled();
        fireEvent.click(previous);
        expect(screen.getByRole("textbox", { name })).toHaveValue("Visitor");
        expect(
          screen.getByRole("region", { name: copy.preview }),
        ).toHaveFocus();
        if (layout === "card") {
          fireEvent.click(previous);
          expect(previous).toBeDisabled();
          fireEvent.click(next);
          expect(screen.getByRole("textbox", { name })).toHaveValue("Visitor");
        }
      },
    );
    it(`${layout} follows tab changes while allowing backwards browsing from the final tab`, () => {
      const form = { ...createForm("en"), layout };
      const view = render(<FormPreview form={form} />);
      view.rerender(<FormPreview form={form} finalPage />);
      expect(screen.getByText(formsCopy("en").thankYou)).toBeInTheDocument();
      fireEvent.click(
        screen.getByRole("button", { name: "Previous preview page" }),
      );
      expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
      view.rerender(<FormPreview form={form} finalPage appearance="dark" />);
      expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
      view.rerender(<FormPreview form={form} />);
      expect(
        screen.getByRole("button", { name: "Previous preview page" }),
      ).toBeDisabled();
    });
  }
});
