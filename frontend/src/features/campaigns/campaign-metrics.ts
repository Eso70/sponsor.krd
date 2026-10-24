import type { TikTokCampaign } from "./types";

/** This workspace stores campaign drafts locally; it has no reporting feed. */
export const CAMPAIGN_REPORTING_CAPABILITIES = { liveReporting: false } as const;

export function campaignReportedValue(value: string | number): string | number {
  return CAMPAIGN_REPORTING_CAPABILITIES.liveReporting ? value : "—";
}

export function formatAdAccountAmount(value: number | undefined, currency: string): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function calculateCostPerConversion(
  campaign: Pick<TikTokCampaign, "totalSpent" | "conversions">,
): number | null {
  if (campaign.conversions <= 0) return null;
  return campaign.totalSpent / campaign.conversions;
}

export function formatCostPerConversion(
  campaign: Pick<TikTokCampaign, "totalSpent" | "conversions">,
): string {
  const cost = calculateCostPerConversion(campaign);
  return cost === null ? "—" : `$${cost.toFixed(2)}`;
}

export function calculateConversionRate(
  campaign: Pick<TikTokCampaign, "clicks" | "conversions">,
): number | null {
  if (campaign.clicks <= 0) return null;
  return (campaign.conversions / campaign.clicks) * 100;
}

export function formatConversionRate(
  campaign: Pick<TikTokCampaign, "clicks" | "conversions">,
): string {
  const rate = calculateConversionRate(campaign);
  return rate === null ? "—" : `${rate.toFixed(2)}%`;
}
