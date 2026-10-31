"use client";

import { Handshake } from "lucide-react";
import type { LinktreeSponsor } from "@linktree/types";
import { EditorSection } from "@/components/shared/EditorSection";
import { EditorField } from "@/components/shared/EditorField";
import { EditorImagePicker } from "@/components/shared/EditorImagePicker";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { EDITOR_FIELD_CLASS, editorInputClass } from "@/components/shared/editor-control-styles";
import type { EditorImageCropRequest } from "@/components/shared/EditorImageCropWorkspace";
import { formsCopy } from "@/features/forms/forms-copy";
import { formEditorCopy } from "@/features/forms/form-editor-copy";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { SponsorDestinationField } from "./SponsorDestinationField";
import { sponsorEditorCopy, sponsorIntroCopy } from "../sponsor-editor";

export function LinktreeSponsorEditor({ sponsor, onChange, locale, open, onToggle, errors = {}, requestCrop, onBusyChange, platformTheme = false }: {
  sponsor: LinktreeSponsor;
  onChange: (sponsor: LinktreeSponsor) => void;
  locale: BusinessLocale;
  open: boolean;
  onToggle: () => void;
  errors?: Record<string, string>;
  requestCrop: (request: EditorImageCropRequest) => void;
  onBusyChange: (busy: boolean) => void;
  platformTheme?: boolean;
}) {
  const copy = sponsorEditorCopy[locale];
  return <EditorSection title={copy.title} icon={Handshake} summary={sponsor.enabled ? sponsor.name || copy.title : copy.off}
    open={open} onToggle={onToggle} enabled={sponsor.enabled} enabledLabel={copy.show}
    onEnabled={(enabled) => { onChange({ ...sponsor, enabled }); if (enabled && !open) onToggle(); }}>
    <EditorField label={copy.intro} className={EDITOR_FIELD_CLASS} error={errors.intro ? copy.introError : undefined}>
      <input aria-label={copy.intro} type="text" value={sponsor.intro ?? sponsorIntroCopy[locale]} maxLength={100} dir="auto"
        className={editorInputClass(!!errors.intro)} onChange={(event) => onChange({ ...sponsor, intro: event.target.value })} />
    </EditorField>
    <SegmentedControl options={[{ value: "text", label: copy.text }, { value: "wordmark", label: copy.wordmark }]}
      value={sponsor.style} onChange={(style) => onChange({ ...sponsor, style, name: style === "wordmark" ? "" : sponsor.name })} accentMode={platformTheme ? "platform" : "tenant"} />
    {sponsor.style === "text" && <EditorField label={copy.name} required={sponsor.enabled} className={EDITOR_FIELD_CLASS} error={errors.name ? copy.nameError : undefined}>
      <input aria-label={copy.name} type="text" value={sponsor.name} maxLength={100} dir="auto" aria-invalid={!!errors.name}
        className={editorInputClass(!!errors.name)} onChange={(event) => onChange({ ...sponsor, name: event.target.value })} />
    </EditorField>}
    {sponsor.style === "wordmark" && <>
      <EditorImagePicker label={copy.logo} images={sponsor.logo ? [sponsor.logo] : []} onChange={(images) => onChange({ ...sponsor, logo: images[0] ?? null })}
        hint={copy.imageHint} copy={{ ...formsCopy(locale), imageError: copy.logoError }} labels={formEditorCopy(locale)}
        variant="component" multiple={false} allowWebp={false} previewOnClick requestCrop={requestCrop} onBusyChange={onBusyChange} />
      {errors.logo && <p role="alert" className="text-xs text-red-500">{copy.logoError}</p>}
    </>}
    <SponsorDestinationField url={sponsor.url} onChange={(url) => onChange({ ...sponsor, url })} locale={locale} error={!!errors.url} />
  </EditorSection>;
}
