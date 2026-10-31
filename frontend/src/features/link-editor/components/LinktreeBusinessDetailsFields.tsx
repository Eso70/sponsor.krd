"use client";
import { EditorField } from "@/components/shared/EditorField";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { VisibilitySwitch } from "@/components/shared/VisibilitySwitch";
import { TimeInput } from "@/components/shared/TimeInput";
import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";
import { EDITOR_INPUT_CLASS, EDITOR_FIELD_CLASS } from "@/components/shared/editor-control-styles";
import { type LinktreeBusinessDetails, type LinktreeSeo } from "@linktree/types/linktree-seo.cjs";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { LINKTREE_DISPLAY_WEEKDAYS, linktreeSeoCopy } from "../linktree-seo-copy";

export function LinktreeBusinessDetailsFields({ seo, onChange, locale, errors }: { seo: LinktreeSeo; onChange: (seo: LinktreeSeo) => void; locale: BusinessLocale; errors: Record<string,string> }) {
  const copy = linktreeSeoCopy(locale), business = seo.business ?? {};
  const categoryHasDetails = Boolean(seo.category && seo.category !== "personal");
  const hasSavedDetails = Object.values(business).some(value => value !== undefined && value !== "");
  if (!categoryHasDetails && !hasSavedDetails) return null;
  const update = (patch: Partial<LinktreeBusinessDetails>) => onChange({ ...seo, business: { ...business, ...patch } });
  const fields: (Exclude<keyof LinktreeBusinessDetails,"hours">)[] = categoryHasDetails ? ["street", "city", "country"] : [];
  if (seo.category === "food") fields.push("cuisine");
  if (categoryHasDetails && !["food", "retail", "travel", "community"].includes(seo.category!)) fields.push("serviceArea", "services");
  // Keep authored details editable when a category changes, including incomplete
  // schedules. Do not silently discard stored content or strand hidden errors.
  for (const field of ["street", "city", "country", "cuisine", "serviceArea", "services"] as const) {
    if (business[field] && !fields.includes(field)) fields.push(field);
  }
  return <fieldset className="space-y-4 border-t border-slate-200/60 pt-4 dark:border-white/[0.06]">
    <legend className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">{copy.details}</legend>
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map(field => <EditorField key={field} label={copy[field]} className={EDITOR_FIELD_CLASS}>
        <ModalTextInput value={business[field] ?? ""} placeholder={copy[field]} maxLength={field === "services" ? 300 : field === "cuisine" ? 120 : field === "city" || field === "country" ? 100 : 200} dir="auto" className={EDITOR_INPUT_CLASS}
          error={errors[`business.${field}`] ? copy.invalid : undefined} onChange={(event) => update({ [field]: event.target.value })} />
      </EditorField>)}
    </div>
    {(categoryHasDetails || business.hours) && <VisibilitySwitch compact checked={Boolean(business.hours)} label={copy.hours}
      onChange={(enabled) => update({ hours: enabled ? { days: [], opens: "", closes: "" } : undefined })} />}
    {business.hours && <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {LINKTREE_DISPLAY_WEEKDAYS.map(day => <button key={day} type="button" aria-pressed={business.hours?.days.includes(day)}
          className={`${SHARED_SOFT_BUTTON_CLASS} px-2.5 py-2 text-xs`}
          onClick={() => { const hours = business.hours!; update({ hours: { ...hours, days: hours.days.includes(day) ? hours.days.filter(value => value !== day) : [...hours.days, day] } }); }}>{copy[day]}</button>)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(["opens", "closes"] as const).map(field => <EditorField key={field} label={copy[field]} interactive className={EDITOR_FIELD_CLASS}>
          <TimeInput hideLabel label={copy[field]} locale={locale} value={business.hours?.[field] ?? ""}
            onChange={value => update({ hours: { ...business.hours!, [field]: value } })} />
        </EditorField>)}
      </div>
      {errors["business.hours"] && <p role="alert" className="text-xs text-red-500">{copy.invalid}</p>}
    </div>}
  </fieldset>;
}
