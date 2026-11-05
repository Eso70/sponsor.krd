import { NextResponse } from "next/server";

/** Retired endpoints never accept credentials or contact the ad provider. */
export function unavailableTikTokAds(_request: Request) {
  return NextResponse.json(
    { success: false, error: { code: "TIKTOK_ADS_UNAVAILABLE", message: "TikTok Ads connection is unavailable" } },
    { status: 410, headers: { "Cache-Control": "no-store, private" } },
  );
}
