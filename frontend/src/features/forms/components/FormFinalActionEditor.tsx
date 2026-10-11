"use client";
import { useFormValidation } from "./FormValidationContext";
import { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { ReorderHandle } from "@/components/shared/ReorderHandle";
import { IconActionButton } from "@/components/shared/IconActionButton";
import type { FormAction } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { FormEditorInput } from "./FormEditorInput";
import { FormActionUrlInput } from "./FormActionUrlInput";

export function FormFinalActionEditor({
  action,
  index,
  group,
  copy,
  labels,
  update,
  remove,
  reorder,
  step,
}: {
  action: FormAction;
  index: number;
  group: string;
  copy: FormsCopy;
  labels: FormEditorCopy;
  update: (patch: Partial<FormAction>) => void;
  remove: () => void;
  reorder: (source: string, target: string) => void;
  step: (offset: number) => void;
}) {
  const [expanded, setOpen] = useState(true);
  const validation = useFormValidation();
  const open = expanded || validation.selected?.actionId === action.id;
  const title =
    action.type === "website"
      ? labels.website
      : action.type === "app"
        ? labels.app
        : labels.viewContent;
  const format = action.contentFormat ?? "pdf";
  return (
    <section
      data-reorder-id={action.id}
      data-reorder-group={group}
      className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <ReorderHandle
          id={action.id}
          group={group}
          label={`${labels.reorder} ${title}`}
          onReorder={reorder}
          onStep={step}
        />
        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            validation.select(null);
            setOpen(!open);
          }}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 py-2 text-start text-sm font-bold"
        >
          <span>{title}</span>
          <ChevronDown
            aria-hidden
            className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        <IconActionButton
          label={`${copy.remove} ${title} ${index + 1}`}
          tone="danger"
          onClick={remove}
        >
          <Trash2 className="size-3.5" />
        </IconActionButton>
      </div>
      {open && (
        <div className="space-y-4 border-t border-slate-200 p-4 dark:border-white/10">
          {action.type === "app" && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {labels.appUrlHint}
            </p>
          )}
          {action.type === "content" && (
            <fieldset className="space-y-2">
              <legend className="mb-2 text-[13px] font-bold text-slate-600 dark:text-slate-300">
                {labels.selectFormat}
              </legend>
              <div className="flex flex-wrap gap-4">
                {(["pdf", "image"] as const).map((value) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name={`format-${action.id}`}
                      value={value}
                      checked={format === value}
                      onChange={() => update({ contentFormat: value })}
                      className="accent-[var(--theme-primary)]"
                    />
                    {value === "pdf" ? labels.viewPdf : labels.viewImage}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <FormEditorInput
            validationField={`actions.${action.id}.text`}
            label={copy.buttonText}
            value={action.text}
            placeholder={labels.buttonHint}
            onChange={(text) => update({ text, textKey: undefined })}
            maxLength={80}
          />
          {action.type === "app" ? (
            <>
              <FormActionUrlInput
                validationField={`actions.${action.id}.appStoreUrl`}
                label={labels.appStore}
                value={action.appStoreUrl ?? action.url}
                placeholder={labels.appStoreHint}
                onChange={(appStoreUrl) => update({ appStoreUrl, url: "" })}
                previewLabel={copy.preview}
              />
              <FormActionUrlInput
                validationField={`actions.${action.id}.googlePlayUrl`}
                label={labels.googlePlay}
                value={action.googlePlayUrl ?? ""}
                placeholder={labels.googlePlayHint}
                onChange={(googlePlayUrl) => update({ googlePlayUrl })}
                previewLabel={copy.preview}
              />
            </>
          ) : (
            <FormActionUrlInput
              validationField={`actions.${action.id}.url`}
              label={
                action.type === "website"
                  ? labels.websiteUrl
                  : format === "pdf"
                    ? labels.pdfUrl
                    : labels.imageUrl
              }
              value={action.url}
              placeholder={labels.urlHint}
              onChange={(url) => update({ url })}
              previewLabel={copy.preview}
            />
          )}
          {action.type === "content" && (
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              {labels.contentUrlHint}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
