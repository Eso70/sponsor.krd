import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createForm, createQuestion } from "../forms-model";
import type { FormQuestion, FormLanguage } from "../types";
import { FormPreview } from "./FormPreview";
import { FormProductSelectionEditor } from "./FormProductSelectionEditor";
import { productMoney, productLineTotal } from "../product-selection";
import { formEditorIssues } from "../form-editor-validation";
import { formsCopy } from "../forms-copy";

function product(): FormQuestion {
  return {
    ...createQuestion("product"),
    label: "Materials",
    productSelection: {
      currency: "USD",
      items: [
        { id: "cement", name: "Cement", unit: "bag", unitPrice: 7 },
        { id: "steel", name: "Steel", unit: "meter", unitPrice: 2.5 },
      ],
    },
  };
}
function Editor() {
  const [question, setQuestion] = useState(product());
  return (
    <FormProductSelectionEditor
      question={question}
      language="en"
      onChange={(patch) => setQuestion((current) => ({ ...current, ...patch }))}
    />
  );
}

describe("product selection", () => {
  it.each(["form", "card"] as const)(
    "calculates quantities, line totals and a mock completion in %s",
    (layout) => {
      render(
        <FormPreview
          form={{ ...createForm("en"), layout, questions: [product()] }}
        />,
      );
      if (layout === "card")
        fireEvent.click(screen.getByRole("button", { name: "Start" }));
      const send = screen.getByRole("button", { name: "Send" });
      expect(send).toBeDisabled();
      fireEvent.change(
        screen.getByRole("spinbutton", { name: "Quantity: Cement" }),
        { target: { value: "8" } },
      );
      fireEvent.change(
        screen.getByRole("spinbutton", { name: "Quantity: Steel" }),
        { target: { value: "1.5" } },
      );
      expect(screen.getByText("$56.00")).toBeInTheDocument();
      expect(screen.getByText("$3.75")).toBeInTheDocument();
      expect(screen.getByText("$59.75")).toBeInTheDocument();
      expect(send).toBeEnabled();
      fireEvent.change(
        screen.getByRole("spinbutton", { name: "Quantity: Steel" }),
        { target: { value: "-1" } },
      );
      expect(send).toBeDisabled();
      expect(screen.getByRole("alert")).toHaveTextContent("Enter a quantity");
      fireEvent.change(
        screen.getByRole("spinbutton", { name: "Quantity: Steel" }),
        { target: { value: "" } },
      );
      fireEvent.click(send);
      expect(
        screen.getByText("Thank you for your response!"),
      ).toBeInTheDocument();
    },
  );
  it("allows configuring, adding and removing products with shared editor controls", () => {
    render(<Editor />);
    const price = screen.getAllByRole("textbox", { name: "Unit price" })[0];
    expect(price).toHaveAttribute("inputmode", "decimal");
    expect(price).toHaveClass("!h-10");
    fireEvent.change(price, { target: { value: "12.50" } });
    expect(price).toHaveValue("12.50");
    fireEvent.change(price, { target: { value: "letters" } });
    expect(price).toHaveValue("12.50");
    fireEvent.change(price, { target: { value: "1e3" } });
    expect(price).toHaveValue("12.50");
    fireEvent.change(price, { target: { value: "١٢٫٥" } });
    expect(price).toHaveValue("12.5");
    fireEvent.change(price, { target: { value: "" } });
    expect(price).toHaveValue("");
    fireEvent.change(
      screen.getAllByRole("textbox", { name: "Product name" })[0],
      { target: { value: "Bricks" } },
    );
    expect(screen.getByDisplayValue("Bricks")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add product" }));
    expect(
      screen.getAllByRole("textbox", { name: "Product name" }),
    ).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Remove product 3" }));
    expect(
      screen.getAllByRole("textbox", { name: "Product name" }),
    ).toHaveLength(2);
    const currency = screen.getByRole("button", { name: "Currency" });
    fireEvent.click(currency);
    fireEvent.click(screen.getByRole("option", { name: "Iraqi dinar (IQD)" }));
    expect(currency).toHaveTextContent("IQD");
  });
  it.each(["en", "ar", "ckb"] as FormLanguage[])(
    "supports saving a configured product question in %s",
    (language) => {
      expect(
        formEditorIssues(
          { ...createForm(language), name: "Demo", questions: [product()] },
          formsCopy(language),
        ),
      ).toEqual([]);
      expect(productMoney(56, "IQD", language)).toBeTruthy();
    },
  );
  it("rounds decimal money without drift", () => {
    expect(productLineTotal(0.1, "3")).toBe(0.3);
    expect(productLineTotal(2.5, "1.5")).toBe(3.75);
    expect(productLineTotal(7, "100001")).toBe(0);
  });
});
