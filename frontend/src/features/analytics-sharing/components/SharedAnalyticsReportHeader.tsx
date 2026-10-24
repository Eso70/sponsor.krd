import Image from "next/image";
import type { AnalyticsShareBranding } from "@linktree/types";
import {
  BUSINESS_LOGO_PLACEHOLDER,
  SPONSOR_KRD_LOGO,
} from "@/lib/brand/brand-assets";

export function SharedAnalyticsReportHeader({
  name,
  branding,
}: {
  name: string;
  branding?: AnalyticsShareBranding;
}) {
  const logo =
    branding?.logo ||
    (branding?.businessTenant === false
      ? SPONSOR_KRD_LOGO
      : BUSINESS_LOGO_PLACEHOLDER);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Image
        src={logo}
        alt={branding?.name ?? ""}
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-xl object-contain"
      />
      <h1
        className="min-w-0 flex-1 truncate text-base font-bold tracking-tight sm:text-lg"
        dir="auto"
        title={name}
      >
        {name}
      </h1>
    </div>
  );
}
