"use client";

import { useTranslations } from "next-intl";
import { BrandAssetTile } from "@/features/link-editor/components/BrandAssetTile";
import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";
import {
  AVATAR_ACCEPT, BUSINESS_FAVICON_PLACEHOLDER, BUSINESS_LOGO_PLACEHOLDER,
  DEFAULT_AVATAR, FAVICON_ACCEPT, LOGO_ACCEPT,
} from "@/lib/brand/brand-assets";

/** Business branding uses the same upload tile as Platform branding. */
export function BusinessBrandingFields({ data, enabled, onUpload }: {
  data: { logo: string; favicon: string; default_avatar: string };
  enabled: boolean;
  onUpload: (file: File, type: "logo" | "favicon" | "default-avatar") => void;
}) {
  const t = useTranslations("SettingsPage");
  const assets = [
    { type: "logo", label: t("logo"), src: data.logo || BUSINESS_LOGO_PLACEHOLDER, accept: LOGO_ACCEPT },
    { type: "default-avatar", label: t("avatar"), src: data.default_avatar || DEFAULT_AVATAR, accept: AVATAR_ACCEPT },
    { type: "favicon", label: t("favicon"), src: data.favicon || BUSINESS_FAVICON_PLACEHOLDER, accept: FAVICON_ACCEPT },
  ] as const;
  return <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-3 sm:gap-5">
    {assets.map((asset) => <div key={asset.type} className="flex min-w-0 flex-col items-center gap-2">
      <BrandAssetTile src={asset.src} alt={asset.label} caption="" captionClassName="hidden"
        inputLabel={asset.label} accept={asset.accept} disabled={!enabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file, asset.type);
          event.target.value = "";
        }}
        className={`${SHARED_SOFT_BUTTON_CLASS} group relative aspect-square w-full cursor-pointer overflow-hidden p-3 ${enabled ? "" : "cursor-not-allowed opacity-60"}`}
        imageClassName={`h-full w-full ${asset.type === "default-avatar" ? "rounded-full object-cover" : "object-contain"}`}
        iconClassName="size-5" width={96} height={96} unoptimized />
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{asset.label}</span>
    </div>)}
  </div>;
}
