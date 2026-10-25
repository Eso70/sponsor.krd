"use client";
import { plainDecimalInput } from "@/lib/utils/numeric-input";
import { FORM_QUESTION_INPUT_CLASS } from "../form-question-input-styles";
import { FormProductUnitPrice } from "./FormProductUnitPrice";
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
  const total =
    items.reduce(
      (sum, item) =>
        sum +
        Math.round(
          productPricing(item, quantities[item.id] ?? "").lineTotal * 100,
        ),
      0,
    ) / 100;
  if (!config || !items.length)
    return (
      <p
        data-form-content
        dir={language === "en" ? "ltr" : "rtl"}
        lang={language}
        className={`${styles.productContent} text-xs opacity-60`}
      >
        {copy.empty}
      </p>
    );
  return (
    <div
      data-form-content
      dir={language === "en" ? "ltr" : "rtl"}
      lang={language}
      className={`${styles.productContent} space-y-2`}
    >
      {items.map((item) => {
        const quantity = quantities[item.id] ?? "";
        const pricing = productPricing(item, quantity);
        return (
          <div
            key={item.id}
            className={`${styles.productRow} grid grid-cols-[minmax(0,1fr)_minmax(4.5rem,5.5rem)] items-center gap-x-3 gap-y-3 p-3 sm:p-4`}
          >
            <p className="col-span-full min-w-0 break-words text-sm font-semibold">
              {item.name}
            </p>
            <FormProductUnitPrice
              originalPrice={item.unitPrice!}
              unitPrice={pricing.unitPrice}
              discountAmount={pricing.discount}
              currency={config.currency}
              unit={item.unit}
              language={language}
            />
            <ModalTextInput
              aria-label={`${copy.quantity}: ${item.name}`}
              aria-invalid={!validProductQuantity(quantity)}
              type="text"
              inputMode="decimal"
              dir="ltr"
              min={0}
              max={MAX_PRODUCT_QUANTITY}
              step="0.001"
              placeholder={copy.quantity}
              value={quantity}
              onChange={(event) => {
                const next = plainDecimalInput(event.target.value);
                if (next === null) return;
                onChange(
                  JSON.stringify({
                    ...quantities,
                    [item.id]: next,
                  }),
                );
              }}
              className={`${FORM_QUESTION_INPUT_CLASS} ${styles.numeric} ${styles.productQuantity} min-w-0`}
            />
            <div
              className={`${styles.productSubtotal} col-span-full flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pt-2.5`}
            >
              <span className="text-xs opacity-70">{copy.lineTotal}</span>
              {validProductQuantity(quantity) ? (
                <FormMoney
                  value={pricing.lineTotal}
                  currency={config.currency}
                />
              ) : (
                <span>—</span>
              )}
            </div>
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
        {invalid ? (
          "—"
        ) : (
          <FormMoney emphasis value={total} currency={config.currency} />
        )}
      </div>
    </div>
  );
}
