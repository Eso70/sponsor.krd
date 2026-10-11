export type PlanStatus = "active" | "inactive" | "archived";
export interface CatalogEntitlement {
  id: string;
  key: string;
  name: string;
  valueType: "boolean" | "integer" | "string";
  status: string;
}
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "grace_period"
  | "paused"
  | "canceled"
  | "expired"
  | "incomplete";
export interface PermissionProfile {
  id: string;
  code: string;
  name: string;
  permissionCount: number;
}
export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  permissionProfileId: string;
  permissionProfileName: string;
  status: PlanStatus;
  currency: string;
  yearlyPriceMinor: number;
  monthlyPriceMinor?: number;
  entitlements?: Record<string, unknown>;
  templateCount?: number;
  trialDays: number;
  displayOrder: number;
  isDefault: boolean;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessOption {
  id: string;
  name: string;
  username: string;
  status: string;
}

export interface BusinessSubscription {
  id: string;
  businessId: string;
  businessName: string;
  username: string;
  businessStatus: string;
  planId: string;
  planName: string;
  permissionProfileId: string;
  permissionProfileName: string;
  status: SubscriptionStatus;
  startsAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  billingCycle?: "free" | "monthly" | "yearly" | "custom";
  cancelsAt?: string | null;
  updatedAt: string;
}

export interface BillingOverview {
  entitlements?: CatalogEntitlement[];
  plans: SubscriptionPlan[];
  permissionProfiles: PermissionProfile[];
  subscriptions: BusinessSubscription[];
  businesses: BusinessOption[];
  summary: {
    activePlans: number;
    activeSubscriptions: number;
    attentionRequired: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BusinessRow extends BusinessOption {
  subscription: BusinessSubscription | null;
}
