import type {
  FormSubmission,
  FormWhatsAppDetailsConfig,
  FormLanguage,
  FormProductAnswer,
} from "@linktree/types";
import { formAnswerText } from "./form-response-utils";
import { productMoney } from "./product-selection";
import { formWhatsAppProductCopy } from "./form-whatsapp-product-copy";
import { whatsAppTextTable } from "./form-whatsapp-text-table";

function columnMoney(value: number, currency: FormProductAnswer["currency"]) {
  return `${productMoney(value, currency).replace(currency, "").trim()} ${currency}`;
}

/** Presentation only. Never changes saved values, quantities, prices or totals. */
export function formatWhatsAppDetails(
  answers: FormSubmission["answers"],
  config: FormWhatsAppDetailsConfig,
  language: FormLanguage = "en",
) {
  const ordered = [...answers];
  if (config.order !== "form")
    ordered.sort((a, b) =>
      config.order === "products_first"
        ? Number(!!b.products) - Number(!!a.products)
        : Number(!!a.products) - Number(!!b.products),
    );
  return ordered
    .map((answer) => {
      const label = config.showLabels ? answer.label.trim() : "";
      const products = answer.products;
      if (products && config.productLayout === "columns") {
        const rows = products.items.map((item) => [
          item.name,
          `${item.quantity}${item.unit ? ` ${item.unit.replace(/\s+/g, " ").trim()}` : ""}`,
          columnMoney(item.unitPrice, products.currency),
          columnMoney(item.lineTotal, products.currency),
        ]);
        const total = `${config.totalLabel.trim()}: ${productMoney(products.total, products.currency)}`;
        return `${label ? `${label} :\n` : ""}${whatsAppTextTable(formWhatsAppProductCopy(language).headers, rows)}\n\n${total}`;
      }
      const value = products
        ? `${products.items
            .map(
              (item) =>
                `• ${item.name.replace(/\s+/g, " ").trim()} — ${item.quantity}${item.unit ? ` ${item.unit.replace(/\s+/g, " ").trim()}` : ""} × ${productMoney(item.unitPrice, products.currency)} = ${productMoney(item.lineTotal, products.currency)}`,
            )
            .join(
              "\n",
            )}\n${config.totalLabel.trim()}: ${productMoney(products.total, products.currency)}`
        : formAnswerText(answer.value);
      if (!value.trim()) return "";
      const separator = config.style === "spaced" || products ? "\n" : " ";
      const text = label ? `${label}:${separator}${value}` : value;
      return config.style === "bullets"
        ? `• ${text.replace(/\n/g, "\n  ")}`
        : text;
    })
    .filter(Boolean)
    .join(config.style === "spaced" ? "\n\n" : "\n");
}
