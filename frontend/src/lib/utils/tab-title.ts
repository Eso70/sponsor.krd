const MAX_TAB_TITLE_LENGTH = 60;
function clean(value: string): string { return value.replace(/[\p{Cc}\s]+/gu, " ").trim(); }
function shorten(value: string, limit: number) { const characters = Array.from(value); return characters.length > limit ? `${characters.slice(0, limit - 1).join("").trimEnd()}…` : value; }
export function shortTabTitle(value: string): string { return shorten(clean(value) || "Sponsor.krd", MAX_TAB_TITLE_LENGTH); }
/** Page first for recognizable tabs; owner branding remains distinct and bounded. */
export function businessTabTitle(businessName: string | null | undefined, section: string): string {
  const page = shorten(clean(section), 36);
  const brand = clean(businessName || "Business");
  if (!page || page.toLocaleLowerCase() === brand.toLocaleLowerCase()) return shortTabTitle(brand);
  return `${page} | ${shorten(brand, MAX_TAB_TITLE_LENGTH - Array.from(page).length - 3)}`;
}
