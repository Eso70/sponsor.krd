import { SponsorKrdMarketingShell } from "@/features/public-site/SponsorKrdMarketingShell";
import { SponsorKrdHero } from "@/features/public-site/SponsorKrdHero";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";
import type { RootPublicLocale } from "@/features/public-site/root-public-locale";

export function HomeLanding({ initialLocale = "ckb" }: { initialLocale?: RootPublicLocale }) {
  return (
    <RootPublicLocaleProvider initialLocale={initialLocale}>
      <SponsorKrdMarketingShell>
        <SponsorKrdHero />
      </SponsorKrdMarketingShell>
    </RootPublicLocaleProvider>
  );
}
