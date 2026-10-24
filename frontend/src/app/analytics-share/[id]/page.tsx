import { businessTabTitle } from "@/lib/utils/tab-title";
import { brandIcons } from "@/lib/brand/tab-branding";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SharedAnalyticsPage } from "@/features/analytics-sharing/components/SharedAnalyticsPage";
import { fetchAnalyticsShareBranding } from "@/features/analytics-sharing/branding.server";
import { publicRequestContext } from "@/lib/public/public-page.server";
const baseMetadata: Metadata = {
  title: "Shared analytics",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";
const shareIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!shareIdPattern.test(id)) return baseMetadata;
  const branding = await fetchAnalyticsShareBranding(id.toLowerCase());
  return {
    ...baseMetadata,
    title: {absolute: businessTabTitle(branding.name, "Shared analytics")},
    icons: brandIcons(branding.favicon, branding.logo),
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  if (!shareIdPattern.test(id)) notFound();
  const { lang } = await searchParams;
  const [branding, context] = await Promise.all([
    fetchAnalyticsShareBranding(id.toLowerCase()),
    publicRequestContext(),
  ]);
  if (context.origin !== branding.origin)
    redirect(
      new URL(
        `/analytics-share/${id.toLowerCase()}?lang=${lang === "ar" || lang === "ckb" ? lang : "en"}`,
        branding.origin,
      ).href,
    );
  return (
    <SharedAnalyticsPage
      key={id.toLowerCase()}
      id={id.toLowerCase()}
      initialLocale={lang === "ar" || lang === "ckb" ? lang : "en"}
      branding={branding}
    />
  );
}
