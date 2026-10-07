import type { BlockedSubdomains, SubdomainAvailability } from "@linktree/types";
import { apiRequest } from "@/lib/api/request";

const settingsPath = "/api/platform/settings/blocked-subdomains";

export const getBlockedSubdomains = (signal?: AbortSignal) =>
  apiRequest<BlockedSubdomains>(settingsPath, { signal });

export const blockSubdomain = (subdomain: string) =>
  apiRequest<BlockedSubdomains>(settingsPath, { method: "POST", json: { subdomain } });

export const unblockSubdomain = (subdomain: string) =>
  apiRequest<BlockedSubdomains>(`${settingsPath}/${encodeURIComponent(subdomain)}`, { method: "DELETE" });

export const checkSignupSubdomain = (value: string, signal: AbortSignal) =>
  apiRequest<SubdomainAvailability>(`/api/signup/subdomain-availability?value=${encodeURIComponent(value)}`, { signal });
