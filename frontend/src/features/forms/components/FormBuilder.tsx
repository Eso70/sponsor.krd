"use client";
import { useState } from "react";
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
import type { useFormTitleAvailability } from "../use-form-title-availability";

export function FormBuilder({
  form,
  onChange,
  copy,
  titleAvailability,
}: {
  form: FormDraft;
  onChange: (patch: Partial<FormDraft>) => void;
  copy: FormsCopy;
  titleAvailability?: ReturnType<typeof useFormTitleAvailability>;
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
    <div
      dir="ltr"
      className="grid min-h-0 min-w-0 gap-4 lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(290px,370px)]"
    >
      <div
        dir={locale === "en" ? "ltr" : "rtl"}
        className="min-h-0 min-w-0 space-y-3 lg:overflow-y-auto lg:overscroll-contain lg:pe-1"
      >
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
        <div role="tablist" aria-label={copy.editor}>
          <SegmentedTabs
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
            className="!rounded-xl !p-1 [&_button]:!h-10 [&_button]:!text-sm"
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
      </div>
      <aside
        className="flex h-[min(70dvh,640px)] min-h-0 min-w-0 flex-col border-t border-slate-200 pt-4 dark:border-white/10 lg:h-full lg:border-t-0 lg:border-s lg:ps-4 lg:pt-0"
        aria-label={copy.preview}
        dir="ltr"
      >
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
      </aside>
    </div>
  );
}
