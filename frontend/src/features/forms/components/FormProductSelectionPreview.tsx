"use client";
import { FORM_QUESTION_INPUT_CLASS } from "../form-question-input-styles";
import { FormProductSavings } from "./FormProductSavings";
import { FormMoney } from "./FormMoney";
import styles from "./FormPreview.module.css";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import type { FormQuestion, FormLanguage } from "../types";
import { productSelectionCopy } from "../product-selection-copy";
import {
  isProductConfigured,
  productQuantities,
  validProductQuantity,
  productPricing,
  MAX_PRODUCT_QUANTITY,
} from "../product-selection";
export function FormProductSelectionPreview({
  question,
  language,
  value,
  onChange,
}: {
  question: FormQuestion;
  language: FormLanguage;
  value: string;
  onChange: (value: string) => void;
}) {
  const copy = productSelectionCopy(language);
  const config = question.productSelection;
  const items = config?.items.filter(isProductConfigured) ?? [];
  const quantities = productQuantities(value);
  const invalid = items.some(
    (item) => !validProductQuantity(quantities[item.id] ?? ""),
  );
  const total = items.reduce(
    (sum, item) =>
      sum + Math.round(productPricing(item, quantities[item.id] ?? "").lineTotal * 100),
    0,
  ) / 100;
  if (!config || !items.length)
    return <p data-form-content dir={language === "en" ? "ltr" : "rtl"} lang={language} className={`${styles.productContent} text-xs opacity-60`}>{copy.empty}</p>;
  return (
    <div data-form-content dir={language === "en" ? "ltr" : "rtl"} lang={language} className={`${styles.productContent} space-y-2`}>
      {items.map((item) => {
        const quantity = quantities[item.id] ?? "";
        const pricing = productPricing(item, quantity);
        return (
          <div
            key={item.id}
            className={`${styles.productRow} grid grid-cols-[minmax(0,1fr)_minmax(4.5rem,5.5rem)] items-center gap-x-3 gap-y-3 p-3 sm:p-4`}
          >
            <p className="col-span-full min-w-0 break-words text-sm font-semibold">{item.name}</p>
            <p className="min-w-0 flex flex-wrap items-baseline gap-x-1 text-xs opacity-70">
              {pricing.discount > 0 && <del className="opacity-60"><FormMoney value={item.unitPrice!} currency={config.currency} /></del>}
              <FormMoney value={pricing.unitPrice} currency={config.currency} />
              {item.unit && <span className="break-words">/ {item.unit}</span>}
            </p>
            <ModalTextInput
              aria-label={`${copy.quantity}: ${item.name}`}
              aria-invalid={!validProductQuantity(quantity)}
              type="number"
              inputMode="decimal"
              dir="ltr"
              min={0}
              max={MAX_PRODUCT_QUANTITY}
              step="0.001"
              placeholder={copy.quantity}
              value={quantity}
              onChange={(event) =>
                onChange(
                  JSON.stringify({
                    ...quantities,
                    [item.id]: event.target.value,
                  }),
                )
              }
              className={`${FORM_QUESTION_INPUT_CLASS} ${styles.numeric} ${styles.productQuantity} min-w-0`}
            />
            <div className={`${styles.productSubtotal} col-span-full flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pt-2.5`}>
              <span className="text-xs opacity-70">{copy.lineTotal}</span>
              {validProductQuantity(quantity) ? <FormMoney
                value={pricing.lineTotal}
                currency={config.currency}
              /> : <span>—</span>}
            </div>
            {validProductQuantity(quantity) && pricing.discount > 0 && <div className="col-span-full"><FormProductSavings value={pricing.discount} currency={config.currency} language={language} /></div>}
          </div>
        );
      })}
      {invalid && (
        <p role="alert" className="text-xs text-red-500">
          {copy.invalidQuantity}
        </p>
      )}
      <div
        aria-live="polite"
        aria-atomic="true"
        className={`${styles.productTotal} flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 p-3 text-sm sm:p-4`}
      >
        <span>{copy.total}</span>
        {invalid ? "—" : <FormMoney emphasis value={total} currency={config.currency} />}
      </div>
    </div>
  );
}
