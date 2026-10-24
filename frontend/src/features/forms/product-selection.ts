import type { FormQuestion } from "./types";
export type ProductSelection = NonNullable<FormQuestion["productSelection"]>;
export {
  MAX_PRODUCT_QUANTITY,
  MAX_PRODUCT_PRICE,
  MAX_PRODUCT_PRICE_BREAKS,
  validProductPrice,
  validProductQuantity,
  validProductPriceBreaks,
  productLineTotal,
} from "@linktree/types/form-product-pricing.cjs";
import {
  validProductPrice,
  validProductQuantity,
  validProductPriceBreaks,
  priceProductLine,
} from "@linktree/types/form-product-pricing.cjs";
export function productPricing(
  item: ProductSelection["items"][number],
  quantity: string,
) {
  return priceProductLine(
    isProductConfigured(item) ? item : { unitPrice: 0 },
    validProductQuantity(quantity) ? quantity : "",
  );
}
export function isProductConfigured(
  item: ProductSelection["items"][number],
): boolean {
  return (
    !!item.name.trim() &&
    validProductPrice(item.unitPrice) &&
    validProductPriceBreaks(item.unitPrice, item.priceBreaks)
  );
}
export function productQuantities(value: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    return {};
  }
}
export function productMoney(
  value: number,
  currency: ProductSelection["currency"],
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    numberingSystem: "latn",
    currencyDisplay: "code",
    minimumFractionDigits: 0,
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
