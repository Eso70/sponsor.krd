import { describe, expect, it } from "vitest";
import { formatWhatsAppDetails } from "./form-whatsapp-details";
import {
  defaultFormWhatsAppDetails,
  submissionWhatsAppDraft,
} from "./form-submission-whatsapp";
import type { FormSubmission } from "./types";
import { productMoney } from "./product-selection";

const answers: FormSubmission["answers"] = [
  {
    questionId: "name",
    label: "Name",
    labelKey: "personName",
    questionType: "short",
    value: "Sara Ali",
  },
  {
    questionId: "phone",
    label: "Phone",
    questionType: "phone",
    value: "+9647501234567",
  },
  { questionId: "request", label: "Request", value: "Deliver tomorrow" },
  {
    questionId: "products",
    label: "Products",
    value: "",
    products: {
      currency: "IQD",
      total: 3000,
      items: [
        {
          id: "p",
          name: "Box",
          unit: "box",
          quantity: 2,
          unitPrice: 1500,
          lineTotal: 3000,
        },
      ],
    },
  },
  { questionId: "region", label: "Region", value: "Erbil" },
  {
    questionId: "id",
    label: "Identity",
    labelKey: "national",
    value: "PRIVATE-ID",
  },
];
describe("restricted WhatsApp details presentation", () => {
  it.each(["en", "ckb", "ar"] as const)(
    "customizes captions and ordering in %s while retaining saved values and privacy",
    (locale) => {
      const before = JSON.stringify(answers);
      const config = {
        ...defaultFormWhatsAppDetails(locale),
        order: "products_first" as const,
        style: "spaced" as const,
        heading: "Order summary",
        namePrefix: "Customer:",
        totalLabel: "Amount due",
        productLayout: "calculation" as const,
      };
      const response = {
        id: "r",
        createdAt: "2026-11-01T00:00:00Z",
        revision: 1,
        consent: true,
        answers,
      };
      const draft = submissionWhatsAppDraft(
        response,
        locale,
        "{{name}}\n{{details}}",
        config,
      )!;
      expect(draft.message).toContain("Customer: Sara Ali");
      expect(draft.message).toContain("Order summary");
      expect(draft.message.indexOf("Products")).toBeLessThan(
        draft.message.indexOf("Request"),
      );
      expect(draft.message.indexOf("Request")).toBeLessThan(
        draft.message.indexOf("Region"),
      );
      expect(draft.message).toContain(
        `Amount due: ${productMoney(3000, "IQD")}`,
      );
      expect(draft.message).toContain(
        `Box — 2 box × ${productMoney(1500, "IQD")} = ${productMoney(3000, "IQD")}`,
      );
      expect(draft.message).not.toContain("PRIVATE-ID");
      expect(draft.message).not.toContain("+9647501234567");
      expect(JSON.stringify(answers)).toBe(before);
    },
  );
  it("supports bullets and hidden question labels without hiding answers or prices", () => {
    const config = {
      ...defaultFormWhatsAppDetails("en"),
      style: "bullets" as const,
      order: "answers_first" as const,
      showLabels: false,
    };
    const output = formatWhatsAppDetails(answers.slice(2, 5), config);
    expect(output).toContain("• Deliver tomorrow");
    expect(output).not.toContain("Request:");
    expect(output.indexOf("Erbil")).toBeLessThan(output.indexOf("Box"));
    expect(output).toContain("3,000");
  });
});
