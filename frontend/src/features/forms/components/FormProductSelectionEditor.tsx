"use client";
import { Plus, Trash2 } from "lucide-react";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { NumberInput } from "@/components/shared/NumberInput";
import { EditorField } from "@/components/shared/EditorField";
import { modalInputClass } from "@/components/shared/modal-input-styles";
import { FORM_QUESTION_INPUT_CLASS } from "../form-question-input-styles";
import { IconActionButton } from "@/components/shared/IconActionButton";
import { createRuntimeId } from "@/lib/utils/random-id";
import type { FormQuestion, FormLanguage } from "../types";
import { productSelectionCopy } from "../product-selection-copy";
import {
  MAX_PRODUCT_PRICE,
  validProductPrice,
  type ProductSelection,
} from "../product-selection";
import { FormEditorInput } from "./FormEditorInput";
export function FormProductSelectionEditor({
  question,
  language,
  onChange,
  copy = productSelectionCopy(language),
}: {
  question: FormQuestion;
  language: FormLanguage;
  copy?: ReturnType<typeof productSelectionCopy>;
  onChange: (patch: Partial<FormQuestion>) => void;
}) {
  const config = question.productSelection ?? { currency: "IQD", items: [] };
  const update = (patch: Partial<ProductSelection>) =>
    onChange({ productSelection: { ...config, ...patch } });
  const patchItem = (
    id: string,
    patch: Partial<ProductSelection["items"][number]>,
  ) =>
    update({
      items: config.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  return (
    <div className="space-y-3">
      <CustomSelect
        label={copy.currency}
        ariaLabel={copy.currency}
        value={config.currency}
        options={[
          { value: "IQD", label: copy.currencyIqd },
          { value: "USD", label: copy.currencyUsd },
          { value: "EUR", label: copy.currencyEur },
        ]}
        onChange={(value) =>
          update({ currency: value as ProductSelection["currency"] })
        }
      />
      {config.items.map((item, index) => (
        <div
          key={item.id}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {copy.title} {index + 1}
            </span>
            <IconActionButton
              label={`${copy.remove} ${index + 1}`}
              tone="danger"
              onClick={() =>
                update({
                  items: config.items.filter((entry) => entry.id !== item.id),
                })
              }
            >
              <Trash2 className="size-3.5" />
            </IconActionButton>
          </div>
          <FormEditorInput
            inputClassName={FORM_QUESTION_INPUT_CLASS}
            label={copy.name}
            value={item.name}
            placeholder={copy.name}
            maxLength={100}
            onChange={(name) => patchItem(item.id, { name })}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormEditorInput
              inputClassName={FORM_QUESTION_INPUT_CLASS}
              label={copy.unit}
              value={item.unit}
              placeholder={copy.unitHint}
              maxLength={30}
              onChange={(unit) => patchItem(item.id, { unit })}
            />
            <EditorField
              label={copy.price}
              className="[&>span:first-child]:text-[13px] [&>span:first-child]:mb-2"
              error={
                item.unitPrice !== null && !validProductPrice(item.unitPrice)
                  ? copy.invalidPrice
                  : undefined
              }
            >
              <NumberInput
                aria-label={copy.price}
                min={0}
                max={MAX_PRODUCT_PRICE}
                step={0.01}
                decimalOnly
                hideSteppers
                value={item.unitPrice}
                placeholder={copy.priceHint}
                onEmpty={() => patchItem(item.id, { unitPrice: null })}
                onValueChange={(unitPrice) => patchItem(item.id, { unitPrice })}
                className={modalInputClass(
                  item.unitPrice !== null && !validProductPrice(item.unitPrice),
                  FORM_QUESTION_INPUT_CLASS,
                )}
              />
            </EditorField>
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={config.items.length >= 20}
        onClick={() =>
          update({
            items: [
              ...config.items,
              { id: createRuntimeId(), name: "", unit: "", unitPrice: null },
            ],
          })
        }
        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-50 dark:border-white/10"
      >
        <Plus className="size-3.5" />
        {copy.add}
      </button>
    </div>
  );
}
