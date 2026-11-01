import type { FormWhatsAppDetailsConfig } from "./forms.types";
export const FORM_WHATSAPP_DETAILS_ORDERS: readonly [
  "form",
  "products_first",
  "answers_first",
];
export const FORM_WHATSAPP_DETAILS_STYLES: readonly [
  "compact",
  "spaced",
  "bullets",
];
export function validFormWhatsAppDetails(
  value: unknown,
): value is FormWhatsAppDetailsConfig;
