import type { FormLanguage } from "../types";
import type { FormProductAnswer } from "@linktree/types";
import { productSelectionCopy } from "../product-selection-copy";
import { FormProductSavings } from "./FormProductSavings";
import { FormMoney } from "./FormMoney";
import styles from "./FormPreview.module.css";

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
    <div data-form-content dir={language === "en" ? "ltr" : "rtl"} lang={language} className={`${styles.productContent} space-y-2`}>
      {!compact &&
        answer.items.map((item) => (
          <div
            key={item.id}
            className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-2xl bg-slate-500/[0.04] p-3 dark:bg-white/[0.03]"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-semibold wrap-anywhere">{item.name}</p>
              <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                <bdi>
                  {item.quantity}
                  {item.unit ? ` ${item.unit}` : ""} ×{" "}
                  <FormMoney value={item.unitPrice} currency={answer.currency} />
                </bdi>
              </p>
              <FormProductSavings value={item.discount ?? 0} currency={answer.currency} language={language} />
            </div>
            <FormMoney value={item.lineTotal} currency={answer.currency} />
          </div>
        ))}
      <p className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 ${compact ? "" : "rounded-2xl bg-slate-500/[0.06] p-3 dark:bg-white/5"}`}>
        <span className="text-xs text-slate-500 dark:text-slate-400">{copy.total}</span>
        <FormMoney emphasis value={answer.total} currency={answer.currency} />
      </p>
    </div>
  );
}
