import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { FormBuilder } from "./FormBuilder";
import { createForm } from "../forms-model";
import { formEditorCopy } from "../form-editor-copy";
import { formsCopy } from "../forms-copy";
import type { FormDraft, FormLanguage } from "../types";
function Editor({ language }: { language: FormLanguage }) {
  const [form, setForm] = useState<FormDraft>({
    ...createForm(language),
    layout: "card" as const,
  });
  return (
    <FormBuilder
      form={form}
      copy={formsCopy(language)}
      onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
    />
  );
}
describe("Card layout editor", () => {
  it.each(["en", "ar", "ckb"] as const)(
    "edits welcome, personal card and final screen in %s",
    (language) => {
      render(<Editor language={language} />);
      const copy = formsCopy(language),
        labels = formEditorCopy(language);
      const headline = screen.getByRole("textbox", { name: copy.headline });
      expect(headline).toHaveAttribute("maxlength", "50");
      fireEvent.change(headline, { target: { value: "Welcome title" } });
      const preview = screen.getByRole("complementary", { name: copy.preview });
      expect(preview).toHaveTextContent("Welcome title");
      fireEvent.click(
        screen.getByRole("switch", { name: labels.timeEstimate }),
      );
      expect(preview).toHaveTextContent(labels.minutes);
      fireEvent.click(
        screen.getByRole("button", { name: `${copy.questions} (2)` }),
      );
      const panel = screen.getByRole("tabpanel", { name: copy.content });
      fireEvent.change(
        within(panel).getByPlaceholderText(labels.personalCardHint),
        { target: { value: "Contact us" } },
      );
      fireEvent.click(
        within(preview).getByRole("button", { name: labels.start }),
      );
      expect(preview).toHaveTextContent("Contact us");
      fireEvent.click(screen.getByRole("tab", { name: copy.final }));
      expect(preview).toHaveTextContent(copy.thankYou);
      expect(
        within(preview).queryByRole("progressbar"),
      ).not.toBeInTheDocument();
    },
  );
});
