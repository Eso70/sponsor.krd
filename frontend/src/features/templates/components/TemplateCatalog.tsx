"use client";

import { ManagementGridLayout } from "@/components/shared/ManagementGridLayout";
import { ManagementCard } from "@/components/shared/ManagementCard";
import type { TemplateOption, TemplateKey } from "@/lib/templates/config";
import { LinktreeTemplatePreview } from "./LinktreeTemplatePreview";
import type { TemplatesPageCopy } from "./TemplatesPage";
import { FormTemplatePreview } from "./FormTemplatePreview";
import type { FormLanguage } from "@/features/forms/types";

/** Shared catalogue for Business and Platform; previews retain each design. */
export function TemplateCatalog({ templates, copy, isLocked, category = "linktree", locale = "ckb" }: {
  templates: readonly Pick<TemplateOption, "id" | "name">[];
  copy: TemplatesPageCopy;
  isLocked: (id: string) => boolean;
  category?: "linktree" | "form";
  locale?: FormLanguage;
}) {
  return <ManagementGridLayout desktopColumns={3} items={templates.map((template) => ({
    key: template.id,
    content: <article id={`template-${category}-${template.id}`} className="h-full rounded-2xl">
      <ManagementCard intrinsicHeight={730} className="text-center">
        {category === "form" ? <FormTemplatePreview name={template.name} previewLabel={copy.mobilePreview} locale={locale} /> :
          <LinktreeTemplatePreview templateId={template.id as TemplateKey}
            templateName={template.name} copy={copy} locked={isLocked(template.id)} />}
      </ManagementCard>
    </article>,
  }))} />;
}
