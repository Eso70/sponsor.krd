"use client";
import { FORM_QUESTION_INPUT_CLASS } from "../form-question-input-styles";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import type { FormQuestion, FormLanguage } from "../types";
import { productSelectionCopy } from "../product-selection-copy";
import {
  isProductConfigured,
  productQuantities,
  validProductQuantity,
  productLineTotal,
  productMoney,
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
      sum + productLineTotal(item.unitPrice!, quantities[item.id] ?? ""),
    0,
  );
  if (!config || !items.length)
    return <p className="text-xs opacity-60">{copy.empty}</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const quantity = quantities[item.id] ?? "";
        return (
          <div
            key={item.id}
            className="grid grid-cols-[minmax(0,1fr)_6rem] items-start gap-3 rounded-lg border border-[var(--preview-border)] p-3"
          >
            <div className="min-w-0 space-y-1">
              <p className="break-words text-sm font-semibold">{item.name}</p>
              <p className="text-xs opacity-65">
                {productMoney(item.unitPrice!, config.currency, language)}
                {item.unit ? ` / ${item.unit}` : ""}
              </p>
              <p className="text-xs font-semibold">
                {copy.lineTotal}:{" "}
                <bdi>
                  {productMoney(
                    productLineTotal(item.unitPrice!, quantity),
                    config.currency,
                    language,
                  )}
                </bdi>
              </p>
            </div>
            <label className="space-y-1 text-xs">
              {copy.quantity}
              <ModalTextInput
                aria-label={`${copy.quantity}: ${item.name}`}
                aria-invalid={!validProductQuantity(quantity)}
                type="number"
                inputMode="decimal"
                min={0}
                max={MAX_PRODUCT_QUANTITY}
                step="0.001"
                placeholder="0"
                value={quantity}
                onChange={(event) =>
                  onChange(
                    JSON.stringify({
                      ...quantities,
                      [item.id]: event.target.value,
                    }),
                  )
                }
                className={FORM_QUESTION_INPUT_CLASS}
              />
            </label>
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
        className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--preview-border)] p-3 text-sm font-semibold"
      >
        <span>{copy.total}</span>
        <bdi>
          {invalid ? "—" : productMoney(total, config.currency, language)}
        </bdi>
      </div>
    </div>
  );
}
