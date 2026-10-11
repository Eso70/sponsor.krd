"use client";
import { BusinessDomainsPanel } from "@/features/domains/components/BusinessDomainsPanel";
import { usePlatformLocale } from "../i18n/PlatformLocaleProvider";
export function PlatformBusinessDomainsModal({
  business,
  onClose,
}: {
  business: { id: string; name: string };
  onClose: () => void;
}) {
  const { locale } = usePlatformLocale();
  return (
    <BusinessDomainsPanel
      key={business.id}
      businessId={business.id}
      businessName={business.name}
      onClose={onClose}
      locale={locale}
    />
  );
}
