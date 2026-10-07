"use client";
import { ManagementModal } from "@/components/shared/ManagementModal";
import { BusinessDomainsPanel } from "@/features/domains/components/BusinessDomainsPanel";
import { domainCopy } from "@/features/domains/copy";
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
    <ManagementModal
      isOpen
      wide
      title={`${domainCopy[locale].title}: ${business.name}`}
      closeLabel={domainCopy[locale].close}
      onClose={onClose}
    >
      <BusinessDomainsPanel
        scope={{ surface: "platform", businessId: business.id }}
        locale={locale}
      />
    </ManagementModal>
  );
}
