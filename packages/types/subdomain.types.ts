export type SubdomainAvailabilityReason = "available" | "invalid" | "blocked" | "taken";

export interface SubdomainAvailability {
  subdomain: string;
  available: boolean;
  reason: SubdomainAvailabilityReason;
}

export interface BlockedSubdomains {
  system: string[];
  custom: string[];
}
