"use client";
import { Globe } from "lucide-react";
import { IconActionButton } from "@/components/shared/IconActionButton";
import { GridCardActionButton } from "@/components/shared/GridCardActionButton";
import { domainCopy } from "@/features/domains/copy";
import { usePlatformLocale } from "../i18n/PlatformLocaleProvider";
export function BusinessDomainManagementButton({
  name,
  onClick,
  variant = "row",
}: {
  name: string;
  onClick: () => void;
  variant?: "row" | "grid";
}) {
  const { locale } = usePlatformLocale();
  const label = `${domainCopy[locale].title}: ${name}`;
  if (variant === "grid") {
    return (
      <GridCardActionButton
        label={label}
        icon={Globe}
        tone="cyan"
        onClick={onClick}
      />
    );
  }
  return (
    <IconActionButton label={label} onClick={onClick}>
      <Globe className="h-4 w-4" />
    </IconActionButton>
  );
}
