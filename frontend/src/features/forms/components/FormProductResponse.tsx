import type { FormLanguage } from "../types";
import type { FormProductAnswer } from "@linktree/types";
import { productSelectionCopy } from "../product-selection-copy";
import { FormMoney } from "./FormMoney";

/** Renders the stored price snapshot, never the form's current price list. */
export function FormProductResponse({
  answer,
  language,
  compact = false,
}: {
  answer: FormProductAnswer;
  language: FormLanguage;
  compact?: boolean;
}) {
  const copy = productSelectionCopy(language);
  return (
    <div className="space-y-2">
      {!compact &&
        answer.items.map((item) => (
          <div
            key={item.id}
            className="space-y-0.5 border-b border-slate-200/60 pb-2 last:border-0 dark:border-white/10"
          >
            <p className="font-semibold wrap-anywhere">{item.name}</p>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
              <bdi>
                {item.quantity}
                {item.unit ? ` ${item.unit}` : ""} ×{" "}
                <FormMoney value={item.unitPrice} currency={answer.currency} /> ={" "}
                <FormMoney value={item.lineTotal} currency={answer.currency} />
              </bdi>
            </p>
          </div>
        ))}
      <p className="font-semibold">
        {copy.total}:{" "}
        <FormMoney value={answer.total} currency={answer.currency} />
      </p>
    </div>
  );
}
