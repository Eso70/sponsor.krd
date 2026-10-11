"use client";
import { useFormValidation } from "./FormValidationContext";
import { useState } from "react";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { ImageIcon, Images } from "lucide-react";
import type { FormDraft } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { FormEditorSection } from "./FormEditorSection";
import { FormIntroductionEditor } from "./FormIntroductionEditor";
import { FormImagePicker } from "./FormImagePicker";
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
  const [open, setOpen] = useState<string | null>("questions");
  const validation = useFormValidation();
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
    <div className="space-y-3">
      <FormEditorSection
        title={labels.banner}
        step={1}
        {...section("banner")}
        enabled={form.bannerEnabled}
        onEnabled={(bannerEnabled) => onChange({ bannerEnabled })}
        enabledLabel={labels.banner}
      >
        <div role="tablist" aria-label={labels.banner} className="max-w-xs">
          <SegmentedTabs
            value={form.bannerMode ?? "image"}
            tabs={[
              { id: "image", label: labels.image, icon: ImageIcon },
              { id: "carousel", label: labels.carousel, icon: Images },
            ]}
            onChange={(bannerMode) => onChange({ bannerMode })}
            fullWidth
            className="!rounded-xl !p-1 [&_button]:!h-8 [&_button]:!rounded-lg [&_button]:!text-xs"
          />
        </div>
        <FormImagePicker
          label={copy.upload}
          images={images}
          multiple={form.bannerMode === "carousel"}
          onChange={(bannerImages) => onChange({ bannerImages, banner: "" })}
          copy={copy}
          variant="banner"
          labels={labels}
          hint={`${labels.uploadHint}. ${labels.imageHint}`}
        />
      </FormEditorSection>
      <FormEditorSection
        title={labels.introduction}
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
          step={formContentOrder(form).length + 3}
          {...section("privacy")}
        >
          <FormPrivacyEditor form={form} onChange={onChange} labels={labels} />
        </FormEditorSection>
      </FormComponentsEditor>
    </div>
  );
}
