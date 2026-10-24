import type { FormProductAnswer } from "@linktree/types";
import type { FormLanguage } from "../types";
import { productSelectionCopy } from "../product-selection-copy";
import { FormMoney } from "./FormMoney";

/** Both live quotes and saved responses show the same explicit saving. */
export function FormProductSavings({
  value,
  currency,
  language,
}: {
  value: number;
  currency: FormProductAnswer["currency"];
  language: FormLanguage;
}) {
  if (value <= 0) return null;
  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5 text-xs opacity-70">
      <span>{productSelectionCopy(language).savings}</span>
      <FormMoney value={value} currency={currency} />
    </p>
  );
}
