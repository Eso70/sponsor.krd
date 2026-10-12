import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormSubmissionDetails } from "./FormSubmissionDetails";
import { productSelectionCopy } from "../product-selection-copy";
import type { FormSubmission } from "../types";

describe("stored product response display", () => {
  it.each(["en", "ckb", "ar"] as const)(
    "renders stored names, quantities and totals in %s",
    (language) => {
      const response: FormSubmission = {
        id: "receipt",
        createdAt: new Date().toISOString(),
        consent: true,
        revision: 1,
        answers: [
          {
            questionId: "products",
            label: "Materials",
            value: "Historic price",
            products: {
              currency: "USD",
              total: 56,
              items: [
                {
                  id: "cement",
                  name: "Cement",
                  unit: "bag",
                  quantity: 8,
                  unitPrice: 7,
                  lineTotal: 56,
                },
              ],
            },
          },
        ],
      };
      render(<FormSubmissionDetails response={response} locale={language} />);
      expect(screen.getByText("Cement")).toBeInTheDocument();
      expect(screen.getByText(/8 bag/)).toBeInTheDocument();
      expect(
        screen.getByText(new RegExp(productSelectionCopy(language).total)),
      ).toBeInTheDocument();
      expect(screen.queryByText("Historic price")).not.toBeInTheDocument();
    },
  );
});
