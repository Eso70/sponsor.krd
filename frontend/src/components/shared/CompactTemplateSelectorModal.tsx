"use client";

import { useCallback, type RefObject } from "react";
import { PickerPopup } from "./PickerPopup";
import { PickerOptionCard } from "./PickerOptionCard";
import { TemplateDesignPreview } from "./TemplateDesignPreview";

export type CompactTemplateOption = {
  id: string;
  name: string;
  previewGradient: string;
};

export interface CompactTemplateSelectorCopy {
  title: string;
  count: string;
  close: string;
  locked: string;
}

export function CompactTemplateSelectorModal({ copy, isOpen, onClose, templates, selectedTemplate, onSelectTemplate, isAllowed, anchorRef }: {
  anchorRef?: RefObject<HTMLElement | null>;
  copy?: CompactTemplateSelectorCopy;
  isOpen: boolean;
  onClose: () => void;
  templates: readonly CompactTemplateOption[];
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
  isAllowed: (templateId: string) => boolean;
}) {
  const selectTemplate = useCallback((id: string) => {
    if (!isAllowed(id)) return;
    onSelectTemplate(id);
    onClose();
  }, [isAllowed, onSelectTemplate, onClose]);
  return (
    <PickerPopup isOpen={isOpen} anchorRef={anchorRef} onClose={onClose}
      title={copy?.title ?? "شێوازی پەڕە هەڵبژێرە"} closeLabel={copy?.close ?? "Close"}
      onEnter={() => selectTemplate(selectedTemplate)}>
      <div className="grid grid-cols-3 gap-2">
        {templates.map((template) => <PickerOptionCard key={template.id} label={template.name}
          selected={selectedTemplate === template.id} disabled={!isAllowed(template.id)} lockedLabel={copy?.locked}
          onSelect={() => selectTemplate(template.id)} preview={<TemplateDesignPreview gradient={template.previewGradient} />} />)}
      </div>
    </PickerPopup>
  );
}
