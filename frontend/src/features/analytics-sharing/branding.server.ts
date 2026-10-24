import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { AnalyticsShareBranding } from "@linktree/types";
import { publicFetch } from "@/lib/public/public-page.server";

/** Public tenant presentation only; report contents still require the access code. */
export const fetchAnalyticsShareBranding = cache(
  async (id: string): Promise<AnalyticsShareBranding> => {
    const response = await publicFetch(
      `/api/public/analytics-shares/${encodeURIComponent(id)}/branding`,
    );
    if ([401, 403, 404, 410].includes(response.status)) notFound();
    if (!response.ok) throw new Error("Shared report temporarily unavailable");
    const body = (await response.json()) as { data: AnalyticsShareBranding };
    return body.data;
  },
);
