"use client";

import { Plus, Trash2 } from "lucide-react";
import { EditorField } from "@/components/shared/EditorField";
import { NumberInput } from "@/components/shared/NumberInput";
import { IconActionButton } from "@/components/shared/IconActionButton";
import { modalInputClass } from "@/components/shared/modal-input-styles";
import {
  SHARED_INSET_CONTROL_CLASS,
  SHARED_SOFT_BUTTON_CLASS,
} from "@/components/shared/shared-control-styles";
import { FORM_QUESTION_INPUT_CLASS } from "../form-question-input-styles";
import {
  MAX_PRODUCT_PRICE,
  MAX_PRODUCT_PRICE_BREAKS,
  MAX_PRODUCT_QUANTITY,
  validProductPrice,
  validProductPriceBreaks,
  type ProductSelection,
} from "../product-selection";
import type { productSelectionCopy } from "../product-selection-copy";

type Product = ProductSelection["items"][number];
/** Optional volume prices belong to the product and use one shared calculator. */
export function FormProductPriceBreaksEditor({
  item,
  copy,
  onChange,
}: {
  item: Product;
  copy: ReturnType<typeof productSelectionCopy>;
  onChange: (breaks: NonNullable<Product["priceBreaks"]>) => void;
}) {
  const breaks = item.priceBreaks ?? [];
  const invalid = !validProductPriceBreaks(item.unitPrice, breaks);
  const patch = (index: number, value: Partial<(typeof breaks)[number]>) =>
    onChange(
      breaks.map((tier, i) => (i === index ? { ...tier, ...value } : tier)),
    );
  const inputClass = modalInputClass(
    false,
    `${FORM_QUESTION_INPUT_CLASS} ${SHARED_INSET_CONTROL_CLASS}`,
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          {copy.quantityPricing}
        </span>
        <button
          type="button"
          className={`${SHARED_SOFT_BUTTON_CLASS} flex items-center gap-1.5 px-2.5 py-1.5 text-xs`}
          disabled={
            invalid ||
            breaks.length >= MAX_PRODUCT_PRICE_BREAKS ||
            !validProductPrice(item.unitPrice) ||
            (breaks.at(-1)?.minimumQuantity ?? 0) >= MAX_PRODUCT_QUANTITY
          }
          onClick={() =>
            onChange([
              ...breaks,
              {
                minimumQuantity: Math.min(
                  MAX_PRODUCT_QUANTITY,
                  (breaks.at(-1)?.minimumQuantity ?? 1) + 1,
                ),
                unitPrice: breaks.at(-1)?.unitPrice ?? item.unitPrice,
              },
            ])
          }
        >
          <Plus className="size-3.5" aria-hidden />
          {copy.addPriceBreak}
        </button>
      </div>
      {breaks.length > 0 && (
        <>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {copy.pricingHelp}
          </p>
          {breaks.map((tier, index) => (
            <div
              key={index}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2"
            >
              <EditorField label={copy.minimumQuantity}>
                <NumberInput
                  aria-label={`${copy.minimumQuantity} ${index + 1}`}
                  value={tier.minimumQuantity}
                  min={0.001}
                  max={MAX_PRODUCT_QUANTITY}
                  step={0.001}
                  decimalOnly
                  hideSteppers
                  className={inputClass}
                  placeholder={copy.minimumQuantity}
                  onEmpty={() => patch(index, { minimumQuantity: null })}
                  onValueChange={(minimumQuantity) =>
                    patch(index, { minimumQuantity })
                  }
                />
              </EditorField>
              <EditorField label={copy.price}>
                <NumberInput
                  aria-label={`${copy.price} ${index + 1}`}
                  value={tier.unitPrice}
                  min={0}
                  max={MAX_PRODUCT_PRICE}
                  step={0.01}
                  decimalOnly
                  hideSteppers
                  className={inputClass}
                  placeholder={copy.price}
                  onEmpty={() => patch(index, { unitPrice: null })}
                  onValueChange={(unitPrice) => patch(index, { unitPrice })}
                />
              </EditorField>
              <div className="flex h-10 items-center">
                <IconActionButton
                  label={`${copy.removePriceBreak} ${index + 1}`}
                  tone="danger"
                  onClick={() => onChange(breaks.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </IconActionButton>
              </div>
            </div>
          ))}
        </>
      )}
      {invalid && (
        <p role="alert" className="text-xs text-red-500">
          {copy.invalidPriceBreaks}
        </p>
      )}
    </div>
  );
}
