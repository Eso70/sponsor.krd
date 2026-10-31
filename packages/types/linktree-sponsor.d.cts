export interface LinktreeSponsor {
  enabled: boolean;
  /** Omitted uses localized default; explicit empty text hides the introduction. */
  intro?: string;
  style: "text" | "wordmark";
  name: string;
  logo: string | null;
  url: string | null;
}
export const LINKTREE_SPONSOR_KEY: "sponsor";
export const LINKTREE_SPONSOR_MAX_NAME: 100;
export function readLinktreeSponsor(value: unknown, validImage?: (value: string) => boolean): LinktreeSponsor;
export function inspectLinktreeSponsor(value: unknown, validImage?: (value: string) => boolean): { value: LinktreeSponsor; errors: Record<string, string> };
