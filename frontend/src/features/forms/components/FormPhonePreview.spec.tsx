import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormPreview } from "./FormPreview";
import { createForm, createQuestion } from "../forms-model";
import { formEditorCopy } from "../form-editor-copy";
import { formsCopy } from "../forms-copy";
import { formText } from "../forms-localization";
describe("Preview phone country selection", () => {
  for (const layout of ["form", "card"] as const) {
    it.each(["en", "ar", "ckb"] as const)(
      `${layout} defaults every phone field to Iraq and keeps each selection independent in %s`,
      (language) => {
        const original = createForm(language);
        const labels = formEditorCopy(language),
          copy = formsCopy(language);
        const phones = [
          original.questions[1],
          {
            ...createQuestion("phone"),
            id: "work",
            label: labels.workPhone,
            labelKey: "workPhone" as const,
            category: "work",
          },
        ];
        render(
          <div className="dark" data-business-dashboard>
            <FormPreview
              form={{ ...original, layout, questions: phones }}
              appearance="light"
            />
          </div>,
        );
        if (layout === "card")
          fireEvent.click(screen.getByRole("button", { name: labels.start }));
        const phoneLabel = formText(
          phones[0].label,
          phones[0].labelKey,
          language,
        );
        const workLabel = formText(
          phones[1].label,
          phones[1].labelKey,
          language,
        );
        const selector = screen.getByRole("button", {
          name: `${labels.callingCode}: ${phoneLabel}`,
        });
        const work = screen.getByRole("button", {
          name: `${labels.callingCode}: ${workLabel}`,
        });
        expect(selector).toHaveTextContent("+964");
        expect(work).toHaveTextContent("+964");
        const names = new Intl.DisplayNames([language], { type: "region" });
        expect(selector).not.toHaveTextContent(names.of("IQ")!);
        fireEvent.click(selector);
        expect(
          screen.getByRole("option", { name: `${names.of("IQ")} (+964)` }),
        ).toHaveAttribute("aria-selected", "true");
        fireEvent.click(
          screen.getByRole("option", { name: `${names.of("GB")} (+44)` }),
        );
        expect(selector).toHaveTextContent("+44");
        expect(work).toHaveTextContent("+964");
        fireEvent.change(screen.getByRole("textbox", { name: phoneLabel }), {
          target: { value: "7700123456" },
        });
        fireEvent.change(screen.getByRole("textbox", { name: workLabel }), {
          target: { value: "7501234567" },
        });
        if (layout === "card") {
          fireEvent.click(screen.getByRole("button", { name: copy.back }));
          fireEvent.click(screen.getByRole("button", { name: labels.start }));
          expect(
            screen.getByRole("button", {
              name: `${labels.callingCode}: ${phoneLabel}`,
            }),
          ).toHaveTextContent("+44");
          expect(screen.getByRole("textbox", { name: phoneLabel })).toHaveValue(
            "7700123456",
          );
        }
        fireEvent.click(screen.getByRole("button", { name: copy.submit }));
        expect(screen.getByText(copy.thankYou)).toBeInTheDocument();
        expect(
          screen.queryByRole("button", {
            name: /Start again|دەستپێکردنەوە|البدء مجددًا/,
          }),
        ).not.toBeInTheDocument();
      },
    );
  }
});
