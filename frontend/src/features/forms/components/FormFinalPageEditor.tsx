"use client";
import { useId } from "react";
import { CheckboxField } from "@/components/shared/CheckboxField";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { VisibilitySwitch } from "@/components/shared/VisibilitySwitch";
import { createRuntimeId } from "@/lib/utils/random-id";
import { actionTextKeys, formText } from "../forms-localization";
import type { FormAction, FormDraft } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { FormEditorInput } from "./FormEditorInput";
import { FormFinalActionEditor } from "./FormFinalActionEditor";

export function FormFinalPageEditor({
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
  const group = useId();
  const actions = form.actions ?? [];
  const update = (id: string, patch: Partial<FormAction>) =>
    onChange({
      actions: actions.map((action) =>
        action.id === id ? { ...action, ...patch } : action,
      ),
    });
  const reorder = (source: string, target: string) => {
    const from = actions.findIndex((action) => action.id === source);
    const to = actions.findIndex((action) => action.id === target);
    if (from < 0 || to < 0 || from === to) return;
    const ordered = [...actions];
    const [action] = ordered.splice(from, 1);
    ordered.splice(to, 0, action);
    onChange({ actions: ordered });
  };
  return (
    <div className="space-y-4">
      <FormEditorInput
        label={copy.headline}
        value={form.finalTitle}
        placeholder={copy.thankYou}
        onChange={(finalTitle) => onChange({ finalTitle })}
        maxLength={100}
      />
      <FormEditorInput
        label={copy.descriptionLabel}
        value={form.finalDescription}
        placeholder={labels.finalDefault}
        onChange={(finalDescription) => onChange({ finalDescription })}
        multiline
        maxLength={300}
      />
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {labels.cta}
        </span>
        <VisibilitySwitch
          compact
          checked={form.actionsEnabled ?? true}
          onChange={(actionsEnabled) => onChange({ actionsEnabled })}
          label={labels.cta}
        />
      </div>
      {form.actionsEnabled !== false && (
        <div className="space-y-3">
          {actions.map((action, index) => (
            <FormFinalActionEditor
              key={action.id}
              action={action}
              index={index}
              group={group}
              copy={copy}
              labels={labels}
              update={(patch) => update(action.id, patch)}
              remove={() =>
                onChange({
                  actions: actions.filter((item) => item.id !== action.id),
                })
              }
              reorder={reorder}
              step={(offset) => {
                const target = actions[index + offset];
                if (target) reorder(action.id, target.id);
              }}
            />
          ))}
          <div className="w-fit min-w-36">
            <CustomSelect
              label={labels.addButton}
              hideLabel
              allowEmptySelection
              triggerLabel={`+ ${labels.addButton}`}
              value=""
              placement="top"
              minMenuWidth={240}
              options={(
                [
                  { value: "app", label: labels.app },
                  { value: "website", label: labels.website },
                  { value: "content", label: labels.viewContent },
                ] as const
              ).map((option) => ({
                ...option,
                disabled: actions.some(
                  (action) => action.type === option.value,
                ),
              }))}
              disabled={
                actions.length >= 5 ||
                ["website", "app", "content"].every((type) =>
                  actions.some((action) => action.type === type),
                )
              }
              onChange={(type) => {
                if (
                  !type ||
                  actions.length >= 5 ||
                  actions.some((action) => action.type === type)
                )
                  return;
                const actionType = type as FormAction["type"];
                onChange({
                  actions: [
                    ...actions,
                    {
                      id: createRuntimeId(),
                      type: actionType,
                      text: formText(
                        "",
                        actionTextKeys[actionType],
                        form.language,
                      ),
                      textKey: actionTextKeys[actionType],
                      url: "",
                      ...(actionType === "app"
                        ? { appStoreUrl: "", googlePlayUrl: "" }
                        : actionType === "content"
                          ? { contentFormat: "pdf" as const }
                          : {}),
                    },
                  ],
                  buttonUrl: "",
                  buttonText: "",
                });
              }}
            />
          </div>
          <CheckboxField
            bare
            compact
            checked={form.showHandCursor ?? true}
            onChange={(showHandCursor) => onChange({ showHandCursor })}
            label={labels.hand}
          />
        </div>
      )}
    </div>
  );
}
