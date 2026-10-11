export type SubscriptionStatus = 'active' | 'inactive';

export interface SubscriptionCatalogPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  currency: string;
  monthlyPriceMinor: number | null;
  yearlyPriceMinor: number | null;
  trialDays: number | null;
  isDefault: boolean;
  templateCount: number;
  entitlements: Record<string, unknown>;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  maxLinktrees: number | 'unlimited';
  status: SubscriptionStatus;
  customDomainEnabled: boolean;
  pixelTrackingEnabled: boolean;
  premiumTemplatesEnabled: boolean;
  removeBrandingEnabled: boolean;
  seoCustomizationEnabled: boolean;
}
