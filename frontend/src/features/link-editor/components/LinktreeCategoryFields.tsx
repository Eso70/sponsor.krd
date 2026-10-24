"use client";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { EditorField } from "@/components/shared/EditorField";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { EDITOR_FIELD_CLASS, EDITOR_INPUT_CLASS } from "@/components/shared/editor-control-styles";
import { LINKTREE_CATEGORIES, LINKTREE_BUSINESS_TYPES, type LinktreeSeo, type LinktreeCategory } from "@linktree/types/linktree-seo.cjs";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { linktreeSeoCopy } from "../linktree-seo-copy";

export function LinktreeCategoryFields({ seo, onChange, locale }: { seo: LinktreeSeo; onChange: (seo: LinktreeSeo) => void; locale: BusinessLocale }) {
  const copy = linktreeSeoCopy(locale);
  const category = LINKTREE_CATEGORIES.find(item => item.id === seo.category);
  return <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <CustomSelect label={copy.category} ariaLabel={copy.category} value={seo.category ?? ""} inheritAppearance triggerClassName={EDITOR_INPUT_CLASS}
        options={[{ value: "", label: copy.none }, ...LINKTREE_CATEGORIES.map(item => ({ value: item.id, label: item.labels[locale] }))]}
        onChange={(value) => onChange({ ...seo, category: value ? value as LinktreeCategory : undefined, businessType: undefined, customCategory: undefined })} />
      {category && category.types.length > 0 && <CustomSelect label={copy.type} ariaLabel={copy.type} value={seo.businessType ?? ""} inheritAppearance triggerClassName={EDITOR_INPUT_CLASS}
        options={[{ value: "", label: copy.none }, ...LINKTREE_BUSINESS_TYPES.filter(item => category.types.includes(item.id)).map(item => ({ value: item.id, label: item.labels[locale] }))]}
        onChange={(businessType) => onChange({ ...seo, businessType: businessType || undefined })} />}
    </div>
    {seo.category === "other" && <EditorField label={copy.customCategory} className={EDITOR_FIELD_CLASS}>
      <ModalTextInput value={seo.customCategory ?? ""} placeholder={copy.customCategory} maxLength={80} dir="auto" className={EDITOR_INPUT_CLASS}
        onChange={(event) => onChange({ ...seo, customCategory: event.target.value })} />
    </EditorField>}
  </div>;
}
