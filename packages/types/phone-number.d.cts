export type PhoneNumberIssue =
  "empty" | "invalid" | "too_short" | "too_long" | "country_mismatch";
export type PhoneNumberInspection =
  | { valid: true; number: string; reason: null }
  | { valid: false; number: null; reason: PhoneNumberIssue };
export function inspectPhoneNumber(
  value: string,
  selectedCode: string,
): PhoneNumberInspection;
export function normalizePhoneNumber(
  value: string,
  selectedCode: string,
): string | null;
/** Checks entry prefixes; complete numbers still require inspectPhoneNumber. */
export function phoneNumberHasAllowedStart(
  value: string,
  selectedCode: string,
): boolean;
