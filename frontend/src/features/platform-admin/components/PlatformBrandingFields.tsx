import type { ChangeEvent } from "react";
import { BrandAssetTile } from "@/features/link-editor/components/BrandAssetTile";
import { SPONSOR_KRD_LOGO } from "@/lib/brand/brand-assets";
import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";

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
        className={`${SHARED_SOFT_BUTTON_CLASS} group relative h-28 w-28 cursor-pointer overflow-hidden p-3`}
        imageClassName="h-full w-full object-contain"
        iconClassName="h-5 w-5"
        width={112}
        height={112}
        unoptimized
      />
    </div>
  );
}
