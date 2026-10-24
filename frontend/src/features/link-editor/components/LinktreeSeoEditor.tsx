"use client";
import { useEffect, useRef, useState } from "react";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import type { LinktreeSeo } from "@linktree/types/linktree-seo.cjs";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { EditorField } from "@/components/shared/EditorField";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { ModalTextArea } from "@/components/shared/ModalTextArea";
import { EditorImageUpload } from "@/components/shared/EditorImageUpload";
import { EDITOR_INPUT_CLASS, EDITOR_TEXTAREA_CLASS, EDITOR_FIELD_CLASS, EDITOR_CARD_CLASS } from "@/components/shared/editor-control-styles";
import type { EditorImageCropRequest } from "@/components/shared/EditorImageCropWorkspace";
import { formsCopy } from "@/features/forms/forms-copy";
import { readFormImage } from "@/features/forms/form-media";
import { automaticPageSeo } from "@/lib/public/page-seo";
import { linktreeSeoCopy } from "../linktree-seo-copy";
import { LinktreeBusinessDetailsFields } from "./LinktreeBusinessDetailsFields";
import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";

export function LinktreeSeoEditor({ seo, onChange, locale, errors, headline, slogan, description, requestCrop }: {
  seo: LinktreeSeo; onChange: (seo: LinktreeSeo) => void; locale: BusinessLocale; errors: Record<string,string>;
  headline: string; slogan: string; description: string; requestCrop: (request: EditorImageCropRequest) => void;
}) {
  const copy = linktreeSeoCopy(locale), mediaCopy = formsCopy(locale);
  const fileInput = useRef<HTMLInputElement>(null);
  const latest = useRef({ seo, onChange });
  const generation = useRef(0);
  useEffect(() => { latest.current = { seo, onChange }; }, [seo, onChange]);
  useEffect(() => () => { generation.current++; }, []);
  const [imageError, setImageError] = useState<string>();
  const resolved = automaticPageSeo({ name: headline, subtitle: slogan, description, template_config: { seo } });
  const automatic = automaticPageSeo({ name: headline, subtitle: slogan, description, template_config: { seo: { ...seo, title: undefined, description: undefined } } });
  const patch = (value: Partial<LinktreeSeo>) => latest.current.onChange({ ...latest.current.seo, ...value });
  return <div className="space-y-4">
    <p className="text-xs text-slate-500 dark:text-slate-400">{copy.defaults}</p>
    <EditorField label={copy.title} hint={!seo.title?.trim() ? copy.auto : undefined} className={EDITOR_FIELD_CLASS}>
      <ModalTextInput aria-label={copy.title} value={seo.title ?? automatic.title} placeholder={copy.title} maxLength={150} dir="auto" className={EDITOR_INPUT_CLASS}
        error={errors.title ? copy.invalid : undefined} onChange={(event) => patch({ title: event.target.value })} onBlur={() => { if (seo.title === "") patch({ title: undefined }); }} />
    </EditorField>
    <EditorField label={copy.description} className={EDITOR_FIELD_CLASS} error={errors.description ? copy.invalid : undefined}>
      <ModalTextArea aria-label={copy.description} value={seo.description ?? automatic.description} placeholder={copy.description} maxLength={300} dir="auto" className={EDITOR_TEXTAREA_CLASS}
        onChange={(event) => patch({ description: event.target.value })} onBlur={() => { if (seo.description === "") patch({ description: undefined }); }} />
    </EditorField>
    {(seo.title?.trim() || seo.description?.trim()) && <button type="button" className={`${SHARED_SOFT_BUTTON_CLASS} px-3 py-2 text-xs font-semibold`} onClick={() => patch({ title: undefined, description: undefined })}>{copy.useInformation}</button>}
    <div className="grid gap-3 sm:grid-cols-2">
      <CustomSelect label={copy.indexing} ariaLabel={copy.indexing} value={seo.indexing ?? "auto"} options={[{ value: "auto", label: copy.auto }, { value: "noindex", label: copy.noindex }]}
        inheritAppearance triggerClassName={EDITOR_INPUT_CLASS} onChange={(indexing) => patch({ indexing })} />
      <CustomSelect label={copy.language} ariaLabel={copy.language} value={seo.language ?? "auto"} options={[{ value: "auto", label: copy.auto }, { value: "ckb", label: "کوردی" }, { value: "ar", label: "العربية" }, { value: "en", label: "English" }]}
        inheritAppearance triggerClassName={EDITOR_INPUT_CLASS} onChange={(language) => patch({ language })} />
    </div>
    <EditorField label={copy.image} interactive className={EDITOR_FIELD_CLASS}>
      <EditorImageUpload image={seo.socialImage} label={copy.image} removeLabel={mediaCopy.remove} fileInputRef={fileInput}
        error={imageError || (errors.socialImage ? copy.invalid : undefined)} onRemove={() => { generation.current++; patch({ socialImage: undefined }); setImageError(undefined); }}
        onChange={async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
          const request = ++generation.current;
          try { const socialImage = await readFormImage(file); if (request !== generation.current) return; patch({ socialImage }); setImageError(undefined); } catch { if (request === generation.current) setImageError(mediaCopy.imageError); } }}
        cropLabel={mediaCopy.imageCrop.title} onCrop={seo.socialImage ? (button) => requestCrop({ src: seo.socialImage!, aspect: "free", maxEdge: 1200, allowWebp: false, returnFocus: button,
          onConfirm: async (file) => patch({ socialImage: await readFormImage(file) }) }) : undefined} />
    </EditorField>
    <div className={`${EDITOR_CARD_CLASS} space-y-1 p-3`} aria-label={copy.preview}>
      <p className="text-xs text-slate-400">{copy.preview}</p>
      <p dir="auto" className="break-words text-base font-medium text-blue-700 dark:text-blue-300">{resolved.title}</p>
      <p dir="auto" className="break-words text-xs leading-5 text-slate-500 dark:text-slate-400">{resolved.description}</p>
    </div>
    <LinktreeBusinessDetailsFields seo={seo} onChange={onChange} locale={locale} errors={errors} />
  </div>;
}
