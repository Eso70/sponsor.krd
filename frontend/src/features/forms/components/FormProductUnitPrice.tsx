import type { FormLanguage } from "../types";
import type { ProductSelection } from "../product-selection";
import { productSelectionCopy } from "../product-selection-copy";
import { FormMoney } from "./FormMoney";
import styles from "./FormPreview.module.css";

/** One price presentation for public forms, editor and template previews. */
export function FormProductUnitPrice({
  originalPrice,
  unitPrice,
  discountAmount,
  currency,
  unit,
  language,
}: {
  originalPrice: number;
  unitPrice: number;
  discountAmount: number;
  currency: ProductSelection["currency"];
  unit?: string;
  language: FormLanguage;
}) {
  const discounted = unitPrice < originalPrice;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
      <span
        dir="ltr"
        className="inline-flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1"
      >
        {discounted && (
          <>
            <del className="opacity-50">
              <FormMoney
                value={originalPrice}
                currency={currency}
                strikethrough
              />
            </del>
            <span aria-hidden className="opacity-30">
              |
            </span>
          </>
        )}
        <FormMoney value={unitPrice} currency={currency} />
      </span>
      {unit && <span className="break-words opacity-65">/ {unit}</span>}
      {discounted && (
        <span className={styles.discountBadge}>
          <span>{productSelectionCopy(language).discount}</span>
          <FormMoney value={discountAmount} currency={currency} />
        </span>
      )}
    </div>
  );
}
