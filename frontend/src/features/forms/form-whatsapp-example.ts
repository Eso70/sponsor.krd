import { formEditorCopy } from "./form-editor-copy";
import { formWhatsAppProductCopy } from "./form-whatsapp-product-copy";
import type { FormLanguage, FormSubmission } from "./types";

const examples = {
  en: {
    name: "Ismail Dilshad",
    product: "Natural flowers",
    city: "Erbil",
  },
  ckb: {
    name: "اسماعیل دڵشاد",
    product: "گوڵی سروشتی",
    city: "هەولێر",
  },
  ar: {
    name: "إسماعيل دلشاد",
    product: "زهور طبيعية",
    city: "أربيل",
  },
};

/** Synthetic, local-only example. It has no recipient or customer contact data. */
export function formWhatsAppMockSubmission(
  language: FormLanguage,
): FormSubmission {
  const copy = formWhatsAppProductCopy(language),
    fields = formEditorCopy(language),
    sample = examples[language];
  return {
    id: "whatsapp-example",
    createdAt: "2026-01-01T00:00:00Z",
    revision: 1,
    consent: true,
    answers: [
      {
        questionId: "name",
        questionType: "short",
        labelKey: "personName",
        label: fields.personName,
        value: sample.name,
      },
      {
        questionId: "city",
        questionType: "short",
        label: fields.city,
        value: sample.city,
      },
      {
        questionId: "products",
        questionType: "product",
        label: copy.products,
        value: "",
        products: {
          currency: "IQD",
          total: 3000,
          items: [
            {
              id: "example-item",
              name: sample.product,
              unit: "",
              quantity: 2,
              unitPrice: 1500,
              lineTotal: 3000,
            },
          ],
        },
      },
    ],
  };
}
