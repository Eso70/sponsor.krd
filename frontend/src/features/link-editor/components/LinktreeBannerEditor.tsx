"use client";
import { EditorBannerControls } from "@/components/shared/EditorBannerControls";
import { EditorSection } from "@/components/shared/EditorSection";
import type { EditorImageCropRequest } from "@/components/shared/EditorImageCropWorkspace";
import { formsCopy } from "@/features/forms/forms-copy";
import { formEditorCopy } from "@/features/forms/form-editor-copy";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import type { LinktreeBanner } from "@linktree/types";

export function LinktreeBannerEditor({ banner, onChange, locale, open, onToggle, requestCrop, onBusyChange }: {
  banner: LinktreeBanner;
  onChange: (banner: LinktreeBanner) => void;
  locale: BusinessLocale;
  open: boolean;
  onToggle: () => void;
  requestCrop: (request: EditorImageCropRequest) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const labels = formEditorCopy(locale);
  const copy = { ...formsCopy(locale), imageError: locale === "en" ? "Choose a JPEG or PNG image up to 5 MB." : locale === "ar" ? "اختر صورة JPEG أو PNG حتى 5 ميغابايت." : "وێنەی JPEG یان PNG تا ٥ مێگابایت هەڵبژێرە." };
  return <EditorSection title={labels.banner} open={open} onToggle={onToggle} enabled={banner.enabled}
    onEnabled={(enabled) => onChange({ ...banner, enabled })} enabledLabel={labels.banner}>
    <EditorBannerControls mode={banner.mode} onModeChange={(mode) => onChange({ ...banner, mode })}
      images={banner.images} onChange={(images) => onChange({ ...banner, images })} onBusyChange={onBusyChange}
      label={copy.banner} hint={labels.imageHint} copy={copy} labels={labels} requestCrop={requestCrop} allowWebp={false} previewOnClick />
  </EditorSection>;
}
