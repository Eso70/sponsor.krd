"use client";

import { PublicMarketingHero } from "@/components/public/PublicMarketingHero";
import {
  SPONSOR_KRD_ACCENT_COLOR,
  SPONSOR_KRD_ACCENT_GRADIENT,
} from "@/lib/sponsor-krd-theme";
import { useRootPublicLocale } from "./RootPublicLocaleProvider";
import { rootPublicCopy } from "./root-public-copy";

export function SponsorKrdHero() {
  const { locale } = useRootPublicLocale();
  const copy = rootPublicCopy[locale].hero;
  return (
    <PublicMarketingHero
      accentColor={SPONSOR_KRD_ACCENT_COLOR}
      eyebrow={copy.eyebrow}
      title={
        <>
          {copy.titleBefore}{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: SPONSOR_KRD_ACCENT_GRADIENT }}
          >
            {copy.titleAccent}
          </span>
        </>
      }
      description={copy.description}
      fillViewport
    />
  );
}
