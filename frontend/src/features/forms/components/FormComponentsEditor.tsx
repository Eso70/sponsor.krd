"use client";
import { useId, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { IconActionButton } from "@/components/shared/IconActionButton";
import { ReorderHandle } from "@/components/shared/ReorderHandle";
import { createRuntimeId } from "@/lib/utils/random-id";
import type { FormDraft } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { formContentOrder, reorderFormContent } from "../form-content-order";
import { FormEditorSection } from "./FormEditorSection";
import { FormComponentEditor } from "./FormComponentEditor";
import { FormQuestionsEditor } from "./FormQuestionsEditor";
import { FormComponentPicker } from "./FormComponentPicker";

export function FormComponentsEditor({
  form,
  onChange,
  copy,
  labels,
  openSection,
  onSectionChange,
  children,
}: {
  form: FormDraft;
  onChange: (patch: Partial<FormDraft>) => void;
  copy: FormsCopy;
  labels: FormEditorCopy;
  openSection?: string | null;
  onSectionChange?: (id: string | null) => void;
  children?: ReactNode;
}) {
  const group = useId();
  const [localOpen, setLocalOpen] = useState<string | null>("questions");
  const open = onSectionChange ? openSection : localOpen;
  const setOpen = onSectionChange ?? setLocalOpen;
  const order = formContentOrder(form);
  const reorder = (source: string, target: string) => {
    const patch = reorderFormContent(form, source, target);
    if (patch) onChange(patch);
  };
  return (
    <div className="space-y-3">
      {order.map((id, index) => {
        const block = form.blocks.find((entry) => entry.id === id);
        const title = block
          ? block.type === "products" ||
            block.type === "testimonials" ||
            block.type === "steps" ||
            block.type === "faq" ||
            block.type === "about"
            ? labels[block.type]
            : block.title || labels[block.type ?? "text"]
          : `${copy.questions} (${form.questions.length})`;
        return (
          <FormEditorSection
            key={id}
            title={title}
            step={index + 3}
            open={open === id}
            onToggle={() => setOpen(open === id ? null : id)}
            reorderId={id}
            reorderGroup={group}
            leading={
              <ReorderHandle
                id={id}
                group={group}
                label={`${labels.reorder}: ${title}`}
                onReorder={reorder}
                onStep={(offset) => {
                  const target = order[index + offset];
                  if (target) reorder(id, target);
                }}
              />
            }
            actions={
              block && (
                <IconActionButton
                  label={`${copy.remove} ${title}`}
                  tone="danger"
                  onClick={() => {
                    onChange({
                      blocks: form.blocks.filter((entry) => entry.id !== id),
                      contentOrder: order.filter((entry) => entry !== id),
                    });
                    if (open === id) setOpen(null);
                  }}
                >
                  <Trash2 aria-hidden className="size-4" />
                </IconActionButton>
              )
            }
          >
            {block ? (
              <FormComponentEditor
                block={block}
                language={form.language}
                copy={copy}
                labels={labels}
                onChange={(patch) =>
                  onChange({
                    blocks: form.blocks.map((entry) =>
                      entry.id === id ? { ...entry, ...patch } : entry,
                    ),
                  })
                }
              />
            ) : (
              <FormQuestionsEditor
                form={form}
                onChange={onChange}
                copy={copy}
                labels={labels}
              />
            )}
          </FormEditorSection>
        );
      })}
      {children}
      <FormComponentPicker
        labels={labels}
        disabled={form.blocks.length >= 20}
        onAdd={(type) => {
          const id = createRuntimeId();
          onChange({
            blocks: [
              ...form.blocks,
              { id, type, title: "", text: "", images: [], items: [] },
            ],
            contentOrder: [...order, id],
          });
          setOpen(id);
        }}
      />
    </div>
  );
}
