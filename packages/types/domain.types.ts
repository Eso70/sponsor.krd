export interface BusinessDomain {
  id: string;
  hostname: string;
  status: "pending" | "active" | "disconnected";
  isPrimary: boolean;
  verificationToken: string;
  verifiedAt: string | null;
  checkedAt: string | null;
  lastError: "ownership" | "routing" | null;
}

export interface BusinessDomains {
  enabled: boolean;
  target: string;
  ipv4: string[];
  ipv6: string[];
  subdomain: string;
  domains: BusinessDomain[];
}

export interface ResolvedBusinessDomain {
  subdomain: string;
  hostname: string;
  primaryHostname: string | null;
  isCustom: boolean;
}
