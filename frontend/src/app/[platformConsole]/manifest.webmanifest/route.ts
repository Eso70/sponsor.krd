import { requestBranding } from "@/lib/brand/request-branding.server";
import { platformConsolePath } from "@/lib/platform-console-path";
import { dashboardManifest, dashboardManifestResponse } from "@/lib/brand/dashboard-install";

export async function GET(_request: Request, { params }: { params: Promise<{ platformConsole: string }> }) {
  const { platformConsole } = await params;
  const base = platformConsolePath();
  if (!base || base !== `/${platformConsole}`) return new Response(null, { status: 404 });
  const branding = await requestBranding();
  if (!branding.platform) return new Response(null, { status: 404 });
  return dashboardManifestResponse(dashboardManifest(branding, base));
}
