import { requestBranding } from "@/lib/brand/request-branding.server";
import { brandIconUrl } from "@/lib/brand/tab-branding";
export const dynamic = "force-dynamic";
export async function GET() {
  const branding = await requestBranding();
  return new Response(null, {status: 307, headers: {Location: brandIconUrl(branding.favicon, branding.logo, branding.platform), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"}});
}
