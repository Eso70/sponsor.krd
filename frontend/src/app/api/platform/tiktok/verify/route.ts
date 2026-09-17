import { NextRequest, NextResponse } from "next/server";

export interface TikTokVerifyRequest {
  advertiserId: string;
  accessToken: string;
  businessCenterId?: string;
  connectionMethod?: "direct_token" | "oauth";
  appId?: string;
  appSecret?: string;
}

/**
 * Real TikTok Marketing API Verification Route.
 *
 * Verifies live credentials directly against TikTok Marketing API v2.0
 * endpoint `GET /open_api/v2/advertiser/info/`.
 *
 * If credentials are valid, extracts advertiser name, currency, timezone,
 * balance, and status.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<TikTokVerifyRequest>;
    const advertiserId = body.advertiserId?.trim() || "";
    const accessToken = body.accessToken?.trim() || "";
    const businessCenterId = body.businessCenterId?.trim() || undefined;
    const connectionMethod = body.connectionMethod || "direct_token";

    if (!advertiserId) {
      return NextResponse.json(
        { success: false, error: "Advertiser ID پێویستە" },
        { status: 400 },
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Access Token پێویستە بۆ بەستنەوە" },
        { status: 400 },
      );
    }

    // Live call to TikTok Marketing API v2.0 / v1.3
    const url = new URL(
      "https://business-api.tiktok.com/open_api/v2/advertiser/info/",
    );
    url.searchParams.set("advertiser_ids", JSON.stringify([advertiserId]));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          success: false,
          error: `تیکتۆک وەڵامی نەدایەوە (${response.status}): ${errorText.slice(0, 150)}`,
        },
        { status: 400 },
      );
    }

    const payload = await response.json();

    if (payload.code !== 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            payload.message ||
            `هەڵە لە تیکتۆک (کۆد: ${payload.code}): تکایە دڵنیابە لە دروستی Access Token و Advertiser ID`,
        },
        { status: 400 },
      );
    }

    const adAccountInfo = payload.data?.list?.[0];
    if (!adAccountInfo) {
      return NextResponse.json(
        {
          success: false,
          error:
            "هیچ هەژمارێکی ڕیکلام نەدۆزرایەوە بەم Advertiser ID. دڵنیابە دەسەڵاتی گەیشتنت هەیە لە Business Center.",
        },
        { status: 404 },
      );
    }

    const name =
      adAccountInfo.name ||
      adAccountInfo.company ||
      adAccountInfo.advertiser_name ||
      `TikTok Ad Account (${advertiserId.slice(-4)})`;
    const currency = adAccountInfo.currency || "USD";
    const timezone = adAccountInfo.timezone || "Asia/Baghdad";
    const balance =
      typeof adAccountInfo.balance === "number"
        ? adAccountInfo.balance
        : undefined;

    return NextResponse.json({
      success: true,
      data: {
        id: `tt-acc-${Date.now()}`,
        advertiserId,
        advertiserName: name,
        currency,
        timezone,
        balance,
        status: "connected",
        lastSyncedAt: new Date().toISOString(),
        accountType: "AUCTION",
        connectionMethod,
        businessCenterId,
        companyName: adAccountInfo.company || name,
        accessToken, // Retained in caller state for subsequent sync/calls
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "هەڵەیەکی نەزانراو لە کاتی پەیوەندی";
    return NextResponse.json(
      { success: false, error: `پەیوەندی بە تیکتۆک سەرکەوتوو نەبوو: ${message}` },
      { status: 500 },
    );
  }
}
