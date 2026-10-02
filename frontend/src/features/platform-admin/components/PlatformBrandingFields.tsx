import type { ChangeEvent } from "react";
import { BrandAssetTile } from "@/features/link-editor/components/BrandAssetTile";
import { SPONSOR_KRD_LOGO } from "@/lib/brand/brand-assets";

export function PlatformBrandingFields({ logo, uploadingAsset, logoLabel, onUpload }: {
  logo: string | null;
  uploadingAsset: "logo" | null;
  logoLabel: string;
  onUpload: (asset: "logo", event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex items-center justify-center py-4">
      <BrandAssetTile
        src={logo || SPONSOR_KRD_LOGO}
        alt={logoLabel}
        caption={uploadingAsset ? "…" : logoLabel}
        captionClassName="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-2 py-0.5 text-[9px] text-white"
        accept="image/jpeg,image/png"
        inputLabel={logoLabel}
        onChange={(event) => onUpload("logo", event)}
        disabled={uploadingAsset !== null}
        className="group relative h-28 w-28 cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[#161B22]"
        imageClassName="h-full w-full object-contain"
        iconClassName="h-5 w-5"
        width={112}
        height={112}
        unoptimized
      />
    </div>
  );
}
