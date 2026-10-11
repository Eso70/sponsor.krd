"use client";
import { useFormValidation } from "./FormValidationContext";
import { useState } from "react";
import type { FormDraft } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { FormEditorSection } from "./FormEditorSection";
import { FormIntroductionEditor } from "./FormIntroductionEditor";
import { FormImagePicker } from "./FormImagePicker";
import { FormQuestionsEditor } from "./FormQuestionsEditor";
import { FormPrivacyEditor } from "./FormPrivacyEditor";
export function FormCardContentEditor({
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
  const [open, setOpen] = useState<string | null>("welcome");
  const validation = useFormValidation();
  const activeSection = validation.selected
    ? validation.selected.section === "introduction"
      ? "welcome"
      : validation.selected.section === "questions"
        ? "questions"
        : validation.selected.section === "banner"
          ? "welcome"
          : (validation.selected.blockId ?? open)
    : open;
  const section = (id: string) => ({
    open: activeSection === id,
    onToggle: () => {
      validation.select(null);
      setOpen(activeSection === id ? null : id);
    },
  });
  const background = form.bannerImages?.[0] || form.banner;
  return (
    <div className="space-y-3">
      <FormEditorSection
        title={labels.welcome}
        step={1}
        {...section("welcome")}
      >
        <FormImagePicker
          label={labels.background}
          images={background ? [background] : []}
          onChange={(bannerImages) => onChange({ bannerImages, banner: "" })}
          variant="component"
          labels={labels}
          copy={copy}
          hint={labels.componentImageHint}
        />
        <FormIntroductionEditor
          form={form}
          onChange={onChange}
          copy={copy}
          labels={labels}
          card
        />
      </FormEditorSection>
      <FormEditorSection
        title={`${copy.questions} (${form.questions.length})`}
        step={2}
        {...section("questions")}
      >
        <FormQuestionsEditor
          form={form}
          onChange={onChange}
          copy={copy}
          labels={labels}
        />
      </FormEditorSection>
      <FormEditorSection
        title={labels.privacy}
        step={3}
        {...section("privacy")}
      >
        <FormPrivacyEditor form={form} onChange={onChange} labels={labels} />
      </FormEditorSection>
    </div>
  );
}
