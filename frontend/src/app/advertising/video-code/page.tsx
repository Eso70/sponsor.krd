import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { PublicVideoCodePage } from "@/features/advertising/components/PublicVideoCodePage";
import {
  advertisingPublicProps,
  loadAdvertisingPublicData,
} from "@/features/advertising/public-page-data.server";
import { businessTabTitle } from "@/lib/utils/tab-title";
import { BUSINESS_PUBLIC_LOCALE_COOKIE, publicBusinessLocale } from "@/features/business/i18n/public-locale";
import {
  BUSINESS_FAVICON_PLACEHOLDER,
  BUSINESS_LOGO_PLACEHOLDER,
} from "@/lib/brand/brand-assets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const locale = publicBusinessLocale((await cookies()).get(BUSINESS_PUBLIC_LOCALE_COOKIE)?.value);
  const data = await loadAdvertisingPublicData();
  if (!data) return { title: locale === "ar" ? "رمز الفيديو | Sponsor.krd" : "Video Code | Sponsor.krd" };
  const { business } = data;
  const brandImage = business.logo || business.default_avatar;
  const description = locale === "ar" ? `دليل استخراج رمز فيديو إعلانات تيك توك من ${business.name}` : locale === "en" ? `Guide to getting a TikTok Ads video code from ${business.name}` : `فێرکاری دەرهێنانی کۆدی ڤیدیۆی سپارک ئادسی تیکتۆک لە ${business.name}`;
  return {
    title: businessTabTitle(business.name, locale === "ar" ? "رمز الفيديو" : locale === "en" ? "Video code" : "Ads"),
    description,
    icons: {
      icon: business.favicon || brandImage || BUSINESS_FAVICON_PLACEHOLDER,
      apple: brandImage || BUSINESS_LOGO_PLACEHOLDER,
    },
    openGraph: {
      title: businessTabTitle(business.name, locale === "ar" ? "رمز الفيديو" : locale === "en" ? "Video code" : "Ads"),
      description,
      images: brandImage ? [brandImage] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: businessTabTitle(business.name, locale === "ar" ? "رمز الفيديو" : locale === "en" ? "Video code" : "Ads"),
      description,
      images: brandImage ? [brandImage] : [],
    },
  };
}

export default async function AdvertisingVideoCodePage() {
  const locale = publicBusinessLocale((await cookies()).get(BUSINESS_PUBLIC_LOCALE_COOKIE)?.value);
  const data = await loadAdvertisingPublicData();
  if (!data) notFound();

  return (
    <PublicVideoCodePage
      config={data.config}
      initialLocale={locale}
      {...advertisingPublicProps(data)}
    />
  );
}
