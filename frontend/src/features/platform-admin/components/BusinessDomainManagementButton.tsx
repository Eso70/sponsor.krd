"use client";
import { Globe } from "lucide-react";
import { IconActionButton } from "@/components/shared/IconActionButton";
import { domainCopy } from "@/features/domains/copy";
import { usePlatformLocale } from "../i18n/PlatformLocaleProvider";
export function BusinessDomainManagementButton({
  name,
  onClick,
}: {
  name: string;
  onClick: () => void;
}) {
  const { locale } = usePlatformLocale();
  return (
    <IconActionButton
      label={`${domainCopy[locale].title}: ${name}`}
      onClick={onClick}
    >
      <Globe className="h-4 w-4" />
    </IconActionButton>
  );
}
