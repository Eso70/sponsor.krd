/** Normalize local digits without changing their numeric meaning. */
export function normalizeNumericInput(value: string): string {
  return value
    .replace(/[٠-٩۰-۹]/g, (digit) =>
      String(digit.charCodeAt(0) - (digit >= "۰" ? 0x06f0 : 0x0660)),
    )
    .replace(/٫/g, ".");
}
export function digitsOnlyInput(value: string): string {
  return normalizeNumericInput(value).replace(/[^0-9]/g, "");
}
/** Empty and unfinished decimal input remain editable; exponent notation is excluded. */
export function plainDecimalInput(value: string): string | null {
  const normalized = normalizeNumericInput(value);
  return /^\d*(?:\.\d*)?$/.test(normalized) ? normalized : null;
}

export function plainIntegerInput(value: string): string | null {
  const normalized = normalizeNumericInput(value);
  return /^\d*$/.test(normalized) ? normalized : null;
}
