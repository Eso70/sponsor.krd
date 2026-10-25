/** Render limits in JSX so streamed HTML and client hydration agree. */
const INPUT_LIMITS: Readonly<Record<string, number>> = {
  text: 255,
  search: 120,
  email: 254,
  url: 2048,
  tel: 32,
  password: 256,
};
export const TEXTAREA_LIMIT = 5000;
export function inputMaxLength(
  type = "text",
  explicit?: number,
): number | undefined {
  return explicit ?? INPUT_LIMITS[type];
}
