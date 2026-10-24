export type LinktreeSeoLanguage = "en" | "ckb" | "ar";
export type LinktreeCategory = "food" | "retail" | "beauty" | "health" | "education" | "technology" | "professional" | "automotive" | "real-estate" | "travel" | "media" | "home" | "design" | "personal" | "community" | "other";
export type LinktreeWeekday = "Mo" | "Tu" | "We" | "Th" | "Fr" | "Sa" | "Su";
export interface LinktreeBusinessDetails {
  street?: string; city?: string; country?: string; serviceArea?: string; cuisine?: string; services?: string;
  hours?: { days: LinktreeWeekday[]; opens: string; closes: string };
}
export interface LinktreeSeo {
  version: 1; category?: LinktreeCategory; businessType?: string; customCategory?: string;
  title?: string; description?: string; indexing?: "auto" | "noindex"; language?: "auto" | LinktreeSeoLanguage;
  socialImage?: string; business?: LinktreeBusinessDetails;
}
export const LINKTREE_CATEGORIES: readonly { id: LinktreeCategory; labels: Record<LinktreeSeoLanguage,string>; types: readonly string[] }[];
export const LINKTREE_BUSINESS_TYPES: readonly { id: string; labels: Record<LinktreeSeoLanguage,string>; schema: string }[];
export const LINKTREE_WEEKDAYS: readonly LinktreeWeekday[];
export function inspectLinktreeSeo(raw: unknown, allowDraftImages?: boolean): { value?: LinktreeSeo; errors: Record<string,string> };
export function readLinktreeSeo(raw: unknown, allowDraftImages?: boolean): LinktreeSeo | undefined;
export function linktreeCategoryLabel(seo: LinktreeSeo | undefined, language: LinktreeSeoLanguage): string;

export function readPlanLinktreeSeo(raw: unknown, advancedAllowed: boolean, allowDraftImages?: boolean): LinktreeSeo | undefined;
