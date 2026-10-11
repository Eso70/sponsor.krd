import type { BusinessDomains } from "@linktree/types";
import { apiRequest } from "@/lib/api/request";
export function domainEndpoint(businessId: string) {
  return `/api/platform/businesses/${encodeURIComponent(businessId)}/domains`;
}
export const loadDomains = (endpoint: string, signal?: AbortSignal) =>
  apiRequest<BusinessDomains>(endpoint, { signal });
export const addDomain = (endpoint: string, hostname: string) =>
  apiRequest<BusinessDomains>(endpoint, { method: "POST", json: { hostname } });
export const domainAction = (
  endpoint: string,
  id: string,
  action: "verify" | "primary" | "remove",
) =>
  apiRequest<BusinessDomains>(
    `${endpoint}/${encodeURIComponent(id)}${action === "remove" ? "" : `/${action}`}`,
    { method: action === "remove" ? "DELETE" : "POST" },
  );
