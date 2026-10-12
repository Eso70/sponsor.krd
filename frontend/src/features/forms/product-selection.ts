import type { FormQuestion } from "./types";
export type ProductSelection = NonNullable<FormQuestion["productSelection"]>;
export const MAX_PRODUCT_QUANTITY = 100_000;
export const MAX_PRODUCT_PRICE = 10_000_000;
export function validProductPrice(price: number | null): price is number {
  return (
    price !== null &&
    Number.isFinite(price) &&
    price >= 0 &&
    price <= MAX_PRODUCT_PRICE &&
    Math.abs(Math.round(price * 100) - price * 100) < 0.000001
  );
}
export function isProductConfigured(
  item: ProductSelection["items"][number],
): boolean {
  return !!item.name.trim() && validProductPrice(item.unitPrice);
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
export function validProductQuantity(value: string): boolean {
  return (
    value === "" ||
    (/^(?:\d+(?:\.\d{0,3})?|\.\d{1,3})$/.test(value) &&
      Number(value) <= MAX_PRODUCT_QUANTITY)
  );
}
export function productLineTotal(unitPrice: number, quantity: string): number {
  if (!validProductQuantity(quantity)) return 0;
  // Integer minor units avoid ordinary binary floating-point price drift.
  return (
    Number(
      (BigInt(Math.round(unitPrice * 100)) *
        BigInt(Math.round(Number(quantity) * 1000)) +
        BigInt(500)) /
        BigInt(1000),
    ) / 100
  );
}
export function productMoney(
  value: number,
  currency: ProductSelection["currency"],
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      numberingSystem: "latn",
      currencyDisplay: "code",
      minimumFractionDigits: 0,
      currency,
      maximumFractionDigits: 2,
    },
  ).format(value);
}
