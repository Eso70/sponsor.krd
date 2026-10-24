"use client";
import { EditorPreviewLayout } from "@/components/shared/EditorPreviewLayout";
import { useState, type ReactNode } from "react";
import { FileText, CheckCircle2 } from "lucide-react";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { formsCopy, type FormsCopy } from "../forms-copy";
import { formEditorCopy } from "../form-editor-copy";
import { FormValidationNotice } from "./FormValidationNotice";
import { useFormValidation } from "./FormValidationContext";
import type { FormDraft, FormLanguage } from "../types";
import { FormCardContentEditor } from "./FormCardContentEditor";
import { FormContentEditor } from "./FormContentEditor";
import { FormFinalPageEditor } from "./FormFinalPageEditor";
import { FormPreview } from "./FormPreview";
import { FormPreviewControls } from "./FormPreviewControls";
import { FormTitleEditor } from "./FormTitleEditor";
import { FormEditorInput } from "./FormEditorInput";
import type { useFormTitleAvailability } from "../use-form-title-availability";

export function FormBuilder({
  form,
  onChange,
  copy,
  titleAvailability,
  addressEditor,
}: {
  form: FormDraft;
  onChange: (patch: Partial<FormDraft>) => void;
  copy: FormsCopy;
  titleAvailability?: ReturnType<typeof useFormTitleAvailability>;
  addressEditor?: ReactNode;
}) {
  const validation = useFormValidation();
  const [selectedTab, setTab] = useState<"content" | "final">("content");
  const [previewLanguage, setPreviewLanguage] = useState<FormLanguage>(
    form.language,
  );
  const [previewColor, setPreviewColor] = useState(form.color || "#16a34a");
  const [previewAppearance, setPreviewAppearance] = useState(form.appearance);
  const locale =
    copy === formsCopy("en") ? "en" : copy === formsCopy("ar") ? "ar" : "ckb";
  const labels = formEditorCopy(locale);
  const tab = validation.selected
    ? validation.selected.section === "final"
      ? "final"
      : "content"
    : selectedTab;
  return (
    <EditorPreviewLayout
      direction={locale === "en" ? "ltr" : "rtl"}
      previewLabel={copy.preview}
      preview={
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <FormPreviewControls
            language={previewLanguage}
            appearance={previewAppearance}
            color={previewColor}
            onLanguageChange={setPreviewLanguage}
            onAppearanceChange={(appearance) => {
              setPreviewAppearance(appearance);
              onChange({ appearance });
            }}
            onColorChange={(color) => {
              setPreviewColor(color);
              onChange({ color });
            }}
            copy={formsCopy(previewLanguage)}
            labels={formEditorCopy(previewLanguage)}
          />
          <FormPreview
            form={form}
            finalPage={tab === "final"}
            language={previewLanguage}
            appearance={previewAppearance}
            color={previewColor}
            placeholders
            scrollable
          />
        </div>
      }
    >
      {addressEditor ? (
        <div className="space-y-3">
          <FormEditorInput
            label={copy.name}
            validationField="name"
            value={form.name}
            onChange={(name) => onChange({ name })}
            maxLength={100}
            required
          />
          {addressEditor}
        </div>
      ) : (
        <FormTitleEditor
          title={form.name}
          onChange={(name) => onChange({ name })}
          availability={
            titleAvailability ?? {
              status: "idle",
              slug: undefined,
              retry: () => undefined,
            }
          }
          copy={copy}
          previousSlug={form.slug}
        />
      )}
      <div>
        <SegmentedTabs
          label={copy.editor}
          compact
          value={tab}
          onChange={(tab) => {
            validation.select(null);
            setTab(tab);
          }}
          tabs={[
            { id: "content", label: copy.content, icon: FileText },
            { id: "final", label: copy.final, icon: CheckCircle2 },
          ]}
          fullWidth
        />
      </div>
      <div
        role="tabpanel"
        aria-label={tab === "content" ? copy.content : copy.final}
      >
        {tab === "content" ? (
          form.layout === "card" ? (
            <FormCardContentEditor
              form={form}
              onChange={onChange}
              copy={copy}
              labels={labels}
            />
          ) : (
            <FormContentEditor
              form={form}
              onChange={onChange}
              copy={copy}
              labels={labels}
            />
          )
        ) : (
          <FormFinalPageEditor
            form={form}
            onChange={onChange}
            copy={copy}
            labels={labels}
          />
        )}
      </div>
      <FormValidationNotice
        fields={tab === "final" ? ["url"] : ["questions", "name"]}
      />
    </EditorPreviewLayout>
  );
}
