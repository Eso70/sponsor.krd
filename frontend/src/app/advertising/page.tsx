import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { PublicAdvertisingService } from "@/features/advertising/components/PublicAdvertisingService";
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
  if (!data) return { title: locale === "ar" ? "الإعلانات | Sponsor.krd" : "Ads | Sponsor.krd" };
  const { business } = data;
  const brandImage = business.logo || business.default_avatar;
  const description = locale === "ar" ? `خدمة إعلانات تيك توك من ${business.name}` : locale === "en" ? `TikTok advertising service from ${business.name}` : `خزمەتگوزاری ڕیکلامی تیکتۆک لە ${business.name}`;
  return {
    title: businessTabTitle(business.name, locale === "ar" ? "الإعلانات" : "Ads"),
    description: locale === "ar" ? `باقات ومعلومات خدمة إعلانات تيك توك من ${business.name}` : locale === "en" ? `TikTok advertising packages and service details from ${business.name}` : `پاکێج و زانیاری خزمەتگوزاری ڕیکلامی تیکتۆک لە ${business.name}`,
    icons: {
      icon: business.favicon || brandImage || BUSINESS_FAVICON_PLACEHOLDER,
      apple: brandImage || BUSINESS_LOGO_PLACEHOLDER,
    },
    openGraph: {
      title: businessTabTitle(business.name, locale === "ar" ? "الإعلانات" : "Ads"),
      description,
      images: brandImage ? [brandImage] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: businessTabTitle(business.name, locale === "ar" ? "الإعلانات" : "Ads"),
      description,
      images: brandImage ? [brandImage] : [],
    },
  };
}

export default async function AdvertisingPage() {
  const locale = publicBusinessLocale((await cookies()).get(BUSINESS_PUBLIC_LOCALE_COOKIE)?.value);
  const data = await loadAdvertisingPublicData();
  if (!data) notFound();

  return (
    <PublicAdvertisingService
      config={data.config}
      initialLocale={locale}
      {...advertisingPublicProps(data)}
    />
  );
}
