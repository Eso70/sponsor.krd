import type { TikTokCampaign } from "./types";

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
