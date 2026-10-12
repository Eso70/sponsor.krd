import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createQuestion } from "../forms-model";
import { productSelectionCopy } from "../product-selection-copy";
import { productMoney } from "../product-selection";
import { FormProductSelectionEditor } from "./FormProductSelectionEditor";
import { FormProductSelectionPreview } from "./FormProductSelectionPreview";

describe("Product selection translations", () => {
  it.each(["en", "ckb", "ar"] as const)(
    "renders all editor, dropdown, preview and error copy in %s",
    (language) => {
      const copy = productSelectionCopy(language);
      const english = productSelectionCopy("en");
      for (const [key, text] of Object.entries(copy)) {
        expect(text.trim()).not.toBe("");
        if (language !== "en") {
          expect(text).not.toBe(english[key as keyof typeof english]);
          expect(text).toMatch(/[\u0600-\u06ff]/);
        }
      }
      const question = {
        ...createQuestion("product"),
        productSelection: {
          currency: "IQD" as const,
          items: [
            { id: "item", name: "Authored name", unit: "kg", unitPrice: 7000 },
          ],
        },
      };
      const editor = render(
        <FormProductSelectionEditor
          question={question}
          language={language}
          onChange={() => undefined}
        />,
      );
      expect(
        screen.getByRole("textbox", { name: copy.name }),
      ).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: copy.unit })).toHaveAttribute(
        "placeholder",
        copy.unitHint,
      );
      expect(screen.getByRole("textbox", { name: copy.price })).toHaveAttribute(
        "placeholder",
        copy.priceHint,
      );
      expect(
        screen.getByRole("button", { name: copy.add }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: `${copy.remove} 1` }),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: copy.currency }));
      for (const label of [
        copy.currencyIqd,
        copy.currencyUsd,
        copy.currencyEur,
      ])
        expect(screen.getByRole("option", { name: label })).toBeInTheDocument();
      editor.unmount();
      const invalidEditor = render(
        <FormProductSelectionEditor
          question={{
            ...question,
            productSelection: {
              ...question.productSelection,
              items: [{ ...question.productSelection.items[0], unitPrice: -1 }],
            },
          }}
          language={language}
          onChange={() => undefined}
        />,
      );
      expect(screen.getByText(copy.invalidPrice)).toBeInTheDocument();
      invalidEditor.unmount();
      const preview = render(
        <FormProductSelectionPreview
          question={question}
          language={language}
          value='{"item":"8"}'
          onChange={() => undefined}
        />,
      );
      expect(
        screen.getByRole("spinbutton", {
          name: `${copy.quantity}: Authored name`,
        }),
      ).toBeInTheDocument();
      expect(screen.getByText(copy.total)).toBeInTheDocument();
      expect(
        screen.getAllByText(
          (_, element) =>
            element?.tagName === "BDI" &&
            element.textContent === productMoney(56000, "IQD"),
        ),
      ).toHaveLength(2);
      preview.rerender(
        <FormProductSelectionPreview
          question={question}
          language={language}
          value='{"item":"-1"}'
          onChange={() => undefined}
        />,
      );
      expect(screen.getByRole("alert")).toHaveTextContent(copy.invalidQuantity);
      preview.rerender(
        <FormProductSelectionPreview
          question={createQuestion("product")}
          language={language}
          value=""
          onChange={() => undefined}
        />,
      );
      expect(screen.getByText(copy.empty)).toBeInTheDocument();
    },
  );
});
