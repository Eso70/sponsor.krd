import { BusinessMobileShowcase } from "@/components/business/BusinessMobileShowcase";
import { PublicMarketingHero } from "@/components/public/PublicMarketingHero";

export function BusinessHero({ accentColor }: { accentColor: string }) {
  return (
    <PublicMarketingHero
      accentColor={accentColor}
      title="لینکترییەکانت بە ئاسانی دروست بکە و بەڕێوەیان ببە"
      description="پەڕەیەکی گشتی بۆ لینکەکانت دروست بکە و هەموویان لە یەک شوێندا ڕێک بخە."
    >
      <BusinessMobileShowcase accentColor={accentColor} />
    </PublicMarketingHero>
  );
}
