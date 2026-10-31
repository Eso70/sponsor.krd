import { requestBranding } from "@/lib/brand/request-branding.server";
import { dashboardManifest, dashboardManifestResponse } from "@/lib/brand/dashboard-install";

export async function GET() {
  const branding = await requestBranding();
  if (branding.platform) return new Response(null, { status: 404 });
  return dashboardManifestResponse(dashboardManifest(branding, "/business"));
}
