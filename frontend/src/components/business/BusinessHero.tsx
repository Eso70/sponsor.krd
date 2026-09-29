import { BusinessMobileShowcase } from "@/components/business/BusinessMobileShowcase";
import { PublicMarketingHero } from "@/components/public/PublicMarketingHero";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { businessPublicCopy } from "@/features/business/i18n/public-copy";

export function BusinessHero({ accentColor, locale = "ckb" }: { accentColor: string; locale?: BusinessLocale }) {
  const copy = businessPublicCopy[locale];
  return (
    <PublicMarketingHero
      accentColor={accentColor}
      title={copy.hero.title}
      description={copy.hero.description}
    >
      <BusinessMobileShowcase accentColor={accentColor} copy={copy} />
    </PublicMarketingHero>
  );
}
