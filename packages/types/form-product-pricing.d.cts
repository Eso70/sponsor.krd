export const MAX_PRODUCT_QUANTITY: number;
export const MAX_PRODUCT_PRICE: number;
export const MAX_PRODUCT_PRICE_BREAKS: number;
export interface PricingItem {
  unitPrice: number | null;
  priceBreaks?: readonly {
    minimumQuantity: number | null;
    unitPrice: number | null;
  }[];
}
export function validProductPrice(value: unknown): value is number;
export function validProductQuantity(value: string): boolean;
export function validProductPriceBreaks(
  basePrice: number | null,
  breaks: unknown,
): boolean;
export function productLineTotal(unitPrice: number, quantity: string): number;
export interface ProductLinePricing {
  unitPrice: number;
  lineTotal: number;
  baseUnitPrice: number;
  baseTotal: number;
  discount: number;
  priceBreakMinimum?: number;
}
export function priceProductLine(
  item: PricingItem,
  quantity: string,
): ProductLinePricing;
