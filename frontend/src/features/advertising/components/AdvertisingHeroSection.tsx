"use client";

import { PublicMarketingHero } from "@/components/public/PublicMarketingHero";
import { usePublicAdvertisingText } from "../public-locale";

interface AdvertisingHeroSectionProps {
  title: string;
  description?: string;
  accentColor: string;
  embedded?: boolean;
}

export function AdvertisingHeroSection({
  title,
  description,
  accentColor,
  embedded = false,
}: AdvertisingHeroSectionProps) {
  const t = usePublicAdvertisingText();
  return (
    <PublicMarketingHero
      accentColor={accentColor}
      title={title}
      description={description ?? t("ڤیدیۆکانت بگەیەنە بە بینەری زیاتر و کڕیاری ڕاستەقینە لە ڕێگای سپۆنسەری فەرمی تیکتۆکەوە بە ئەد ئەکاونتی فەرمی تیکتۆک")}
      embedded={embedded}
    />
  );
}
