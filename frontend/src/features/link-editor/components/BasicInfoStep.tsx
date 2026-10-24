"use client";
import type { ReactNode } from "react";
import { memo } from "react";
import type { ColorGradientModalProps } from "@/components/shared/ColorGradientModal";
import { editorInputClass, editorTextareaClass, EDITOR_FIELD_CLASS } from "@/components/shared/editor-control-styles";
import { EditorImageUpload } from "@/components/shared/EditorImageUpload";
import { EditorField } from "@/components/shared/EditorField";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { SolidColorPickerButton } from "@/components/shared/SolidColorPickerButton";
import { VerificationBadgeToggle } from "./VerificationBadgeToggle";
import { LINKTREE_NAME_MAX_LENGTH } from "./validation";
import type { EditorCopy } from "../editor-copy";
import { imageMediaCopy } from "@/components/shared/image-media-copy";

interface BasicInfoStepProps {
  idPrefix?: string;
  copy?: EditorCopy;
  colorCopy?: ColorGradientModalProps["copy"];
  logoPreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  headline: string;
  slogan: string;
  sloganColor: string;
  description: string;
  verificationBadge: boolean;
  onVerificationBadgeChange: (value: boolean) => void;
  errors: { headline?: string; sloganColor?: string; logo?: string };
  headlineWarning?: string | null;
  checkingHeadline?: boolean;
  touched: { headline?: boolean };
  onLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  onCropLogo?: (returnFocus: HTMLElement) => void;
  cropLabel?: string;
  onHeadlineChange: (value: string) => void;
  onHeadlineBlur: () => void;
  onSloganChange: (value: string) => void;
  onSloganColorChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  hideRemoveLogo?: boolean;
  hideImageUploads?: boolean;
  categoryFields?: ReactNode;
  slugField?: ReactNode;
}

export const BasicInfoStep = memo(function BasicInfoStep(props: BasicInfoStepProps) {
  const { copy, errors } = props;
  const headlineLabel = copy?.headline ?? "سەردێڕ";
  const mediaCopy = imageMediaCopy(copy?.language === "en" ? "en" : copy ? "ar" : "ckb");
  return <div className="space-y-4">
    {!props.hideImageUploads && <EditorImageUpload label={copy?.logo ?? "لۆگۆ"} removeLabel={copy?.removeImage ?? "لادانی وێنە"}
      image={props.logoPreview} fileInputRef={props.fileInputRef} onChange={props.onLogoChange} onRemove={props.onRemoveLogo}
      onCrop={props.onCropLogo} cropLabel={props.cropLabel} hideRemove={props.hideRemoveLogo} error={errors.logo}
      previewLabels={{ close: mediaCopy.close, previous: mediaCopy.back, next: mediaCopy.next, zoomIn: mediaCopy.zoomIn, zoomOut: mediaCopy.zoomOut }} />}
    <EditorField label={headlineLabel} required interactive className={EDITOR_FIELD_CLASS}>
      <div className="flex min-w-0 items-center gap-2">
        <ModalTextInput id={props.idPrefix ? `${props.idPrefix}-headline` : "headline"} type="text" aria-label={headlineLabel} value={props.headline} onChange={(event) => props.onHeadlineChange(event.target.value)}
          error={props.touched.headline ? errors.headline : undefined}
          onBlur={props.onHeadlineBlur} required maxLength={LINKTREE_NAME_MAX_LENGTH} aria-invalid={!!(errors.headline && props.touched.headline)}
          className={editorInputClass(!!(errors.headline && props.touched.headline), "min-w-0 flex-1")}
          placeholder={headlineLabel} dir="auto" />
        <VerificationBadgeToggle enabled={props.verificationBadge} onChange={props.onVerificationBadgeChange} label={copy?.verificationBadge ?? "پیشاندانی نیشانەی شینی پشتڕاستکردنەوە"} />
      </div>
      {errors.headline && props.touched.headline ? null : props.checkingHeadline ? <p role="status" className="mt-1 text-xs text-slate-400">{copy?.checkingName ?? "پشکنینی سەردێڕ..."}</p> : props.headlineWarning ? <p className="mt-1 text-xs text-amber-600">{props.headlineWarning}</p> : null}
    </EditorField>
    {props.categoryFields}
    <EditorField label={copy?.slogan ?? "درووشمی بانگەشە"} interactive className={EDITOR_FIELD_CLASS}>
      <div className="flex min-w-0 items-center gap-2">
        <input id={props.idPrefix ? `${props.idPrefix}-slogan` : "slogan"} type="text" aria-label={copy?.slogan ?? "درووشمی بانگەشە"} value={props.slogan} onChange={(event) => props.onSloganChange(event.target.value)} dir="auto"
          className={editorInputClass(false, "min-w-0 flex-1")} placeholder={copy?.slogan ?? "درووشمی بانگەشە"} />
        <SolidColorPickerButton value={props.sloganColor} onChange={props.onSloganColorChange} copy={props.colorCopy} label={copy?.sloganColor ?? "ڕەنگی دروشم"} resetLabel={copy?.clearColor ?? "سڕینەوەی ڕەنگ"} />
      </div>
      {errors.sloganColor && <p role="alert" className="mt-1 text-xs text-red-500">{errors.sloganColor}</p>}
    </EditorField>
    <EditorField label={copy?.description ?? "وەسف"} className={EDITOR_FIELD_CLASS}>
      <textarea id={props.idPrefix ? `${props.idPrefix}-description` : "description"} value={props.description} onChange={(event) => props.onDescriptionChange(event.target.value)} rows={2} dir="auto"
        className={editorTextareaClass()} placeholder={copy?.description ?? "وەسف"} />
    </EditorField>
    {props.slugField}
  </div>;
});
