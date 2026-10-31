export type DirectorySearchParams = Record<string, string | string[] | undefined>;

/** Carry campaign context to a destination, never arbitrary query strings or redirects. */
export function directoryCampaignQuery(params: DirectorySearchParams): string {
  const query = new URLSearchParams();
  for (const key of ["ttclid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const value = params[key];
    if (typeof value === "string" && value.length <= 512) query.set(key, value);
  }
  return query.toString();
}

export function directoryHref(path: string, campaignQuery: string, page?: number): string {
  const query = new URLSearchParams(campaignQuery);
  if (page && page > 1) query.set("page", String(page));
  return query.size ? `${path}?${query.toString()}` : path;
}
