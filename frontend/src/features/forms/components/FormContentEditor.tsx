"use client";
import { formSectionCopy } from "../form-section-copy";
import { useFormValidation } from "./FormValidationContext";
import { Images, Contact, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { EditorBannerControls } from "@/components/shared/EditorBannerControls";
import type { FormDraft } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { FormEditorSection } from "./FormEditorSection";
import { FormIntroductionEditor } from "./FormIntroductionEditor";
import { useFormImageCrop } from "./FormImageCropContext";
import { formContentOrder } from "../form-content-order";
import { FormPrivacyEditor } from "./FormPrivacyEditor";
import { FormComponentsEditor } from "./FormComponentsEditor";

export function FormContentEditor({
  form,
  onChange,
  copy,
  labels,
}: {
  form: FormDraft;
  onChange: (patch: Partial<FormDraft>) => void;
  copy: FormsCopy;
  labels: FormEditorCopy;
}) {
  const details = formSectionCopy(copy);
  const [open, setOpen] = useState<string | null>("questions");
  const validation = useFormValidation();
  const requestCrop = useFormImageCrop();
  const activeSection = validation.selected
    ? validation.selected.section === "introduction"
      ? "introduction"
      : validation.selected.section === "questions"
        ? "questions"
        : validation.selected.section === "banner"
          ? "banner"
          : (validation.selected.blockId ?? open)
    : open;
  const section = (id: string) => ({
    open: activeSection === id,
    onToggle: () => {
      validation.select(null);
      setOpen(activeSection === id ? null : id);
    },
  });
  const images = form.bannerImages?.length
    ? form.bannerImages
    : form.banner
      ? [form.banner]
      : [];
  return (
    <div className="space-y-4 sm:space-y-5">
      <FormEditorSection
        title={labels.banner}
        icon={Images}
        summary={
          form.bannerEnabled !== false
            ? details.count("images", images.length)
            : details.off
        }
        step={1}
        {...section("banner")}
        enabled={form.bannerEnabled}
        onEnabled={(bannerEnabled) => onChange({ bannerEnabled })}
        enabledLabel={labels.banner}
      >
        <EditorBannerControls
          mode={form.bannerMode ?? "image"}
          onModeChange={(bannerMode) => onChange({ bannerMode })}
          validation={validation}
          requestCrop={requestCrop}
          label={copy.upload}
          images={images}
          onChange={(bannerImages) => onChange({ bannerImages, banner: "" })}
          copy={copy}
          variant="banner"
          labels={labels}
          hint={`${labels.uploadHint}. ${labels.imageHint}`}
        />
      </FormEditorSection>
      <FormEditorSection
        title={labels.introduction}
        icon={Contact}
        summary={form.headline.trim() || details.empty}
        step={2}
        {...section("introduction")}
      >
        <FormIntroductionEditor
          form={form}
          onChange={onChange}
          copy={copy}
          labels={labels}
        />
      </FormEditorSection>
      <FormComponentsEditor
        form={form}
        onChange={onChange}
        copy={copy}
        labels={labels}
        openSection={activeSection}
        onSectionChange={(section) => {
          validation.select(null);
          setOpen(section);
        }}
      >
        <FormEditorSection
          title={labels.privacy}
          icon={ShieldCheck}
          summary={form.consentRequired ? details.required : details.automatic}
          step={formContentOrder(form).length + 3}
          {...section("privacy")}
        >
          <FormPrivacyEditor form={form} onChange={onChange} labels={labels} />
        </FormEditorSection>
      </FormComponentsEditor>
    </div>
  );
}
