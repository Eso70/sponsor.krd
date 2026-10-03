import { createElement } from "react";
import { PublicPageShareImage } from "@/components/public/PublicPageShareImage";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { fetchPublicLinktree } from "@/lib/public/public-page.server";
import { automaticPageSeo } from "@/lib/public/page-seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
let font: Promise<Buffer> | undefined;

export async function GET(_request: Request, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const result = await fetchPublicLinktree(uid);
  if (!result) return new Response("Not found", { status: 404 });
  if (typeof result === "string") return new Response("Unavailable", { status: 503 });
  font ||= readFile(path.join(process.cwd(), "public/fonts/KurdishFont-share.ttf"));
  const fontBytes = await font;
  const seo = automaticPageSeo(result.linktree);
  return new ImageResponse(
    createElement(PublicPageShareImage, { title: seo.title, subtitle: seo.imageSubtitle, hostname: new URL(result.origin).hostname }),
    { width: 1200, height: 630, fonts: [{ name: "Rabar", data: fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength) as ArrayBuffer, weight: 400 }],
      headers: { "Cache-Control": "public, max-age=300", "X-Robots-Tag": "noindex" } },
  );
}
