import publicManifest from "@/lib/brand/public-manifest";

/** Explicit route lets nested dashboard metadata override the public manifest link. */
export async function GET() {
  return Response.json(await publicManifest(), { headers: {
    "Content-Type": "application/manifest+json",
    "Cache-Control": "private, no-store",
  } });
}
