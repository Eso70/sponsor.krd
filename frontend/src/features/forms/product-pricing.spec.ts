import { describe, expect, it } from "vitest";
import { productPricing, validProductPriceBreaks } from "./product-selection";
import { createForm, createQuestion, duplicateForm } from "./forms-model";
const item = {
  id: "item",
  name: "Product",
  unit: "piece",
  unitPrice: 8000,
  priceBreaks: [
    { minimumQuantity: 2, unitPrice: 7500 },
    { minimumQuantity: 3, unitPrice: 7000 },
  ],
};
describe("standard volume pricing", () => {
  it.each([
    ["", 0, 8000, 0],
    ["0", 0, 8000, 0],
    ["1", 8000, 8000, 0],
    ["2", 15000, 7500, 1000],
    ["3", 21000, 7000, 3000],
    ["4", 28000, 7000, 4000],
    ["2.5", 18750, 7500, 1250],
  ])(
    "prices quantity %s without stacking offers",
    (quantity, total, unitPrice, discount) => {
      expect(productPricing(item, String(quantity))).toMatchObject({
        lineTotal: total,
        unitPrice,
        discount,
      });
    },
  );
  it("retains the rate until another threshold and preserves standard/free pricing", () => {
    expect(
      productPricing(
        { ...item, priceBreaks: item.priceBreaks.slice(0, 1) },
        "3",
      ).lineTotal,
    ).toBe(22500);
    expect(productPricing({ ...item, priceBreaks: [] }, "2").lineTotal).toBe(
      16000,
    );
    expect(
      productPricing(
        { ...item, priceBreaks: [{ minimumQuantity: 2, unitPrice: 0 }] },
        "2",
      ).lineTotal,
    ).toBe(0);
  });
  it.each([
    [{ minimumQuantity: 2, unitPrice: 9000 }],
    [{ minimumQuantity: 0, unitPrice: 7000 }],
    [{ minimumQuantity: null, unitPrice: 7000 }],
    [{ minimumQuantity: 2, unitPrice: null }],
    [
      { minimumQuantity: 2, unitPrice: 7000 },
      { minimumQuantity: 2, unitPrice: 6000 },
    ],
    [
      { minimumQuantity: 3, unitPrice: 7000 },
      { minimumQuantity: 2, unitPrice: 6000 },
    ],
    [
      { minimumQuantity: 2, unitPrice: 7000 },
      { minimumQuantity: 3, unitPrice: 7500 },
    ],
    [{ minimumQuantity: 2.0001, unitPrice: 7000 }],
    [{ minimumQuantity: 2, unitPrice: 7000.001 }],
    Array.from({ length: 11 }, (_, i) => ({
      minimumQuantity: i + 2,
      unitPrice: 7000,
    })),
  ])("rejects invalid/incomplete breaks %#", (...breaks) =>
    expect(validProductPriceBreaks(8000, breaks)).toBe(false),
  );
  it("clones price breaks independently during form duplication", () => {
    const form = {
      ...createForm("en"),
      questions: [
        {
          ...createQuestion("product"),
          productSelection: { currency: "IQD" as const, items: [item] },
        },
      ],
    };
    const copy = duplicateForm(form);
    copy.questions[0].productSelection!.items[0].priceBreaks![0].unitPrice = 1;
    expect(
      form.questions[0].productSelection!.items[0].priceBreaks![0].unitPrice,
    ).toBe(7500);
  });
});
