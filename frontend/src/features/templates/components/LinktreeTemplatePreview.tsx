"use client";

import { memo, useMemo, type CSSProperties } from "react";
import type { LinktreePresentation as Linktree } from "@linktree/types";
import { DynamicTemplate } from "@/components/templates/DynamicTemplate";
import { createBusinessContactPreviewLinks, createLinktreeTemplatePreview, LINKTREE_TEMPLATE_PREVIEW_THEMES } from "@/components/templates/preview-fixtures";
import type { TemplateKey } from "@/lib/templates/config";
import type { TemplatesPageCopy } from "./TemplatesPage";
import { TemplatePhonePreview, TemplatePreviewSkeleton } from "./TemplatePhonePreview";
export const LinktreeTemplatePreview = memo(function LinktreeTemplatePreview({
  templateId,
  templateName,
  locked,
  copy,
}: {
  templateId: TemplateKey;
  templateName: string;
  locked?: boolean;
  copy: TemplatesPageCopy;
}) {
  const linktree = useMemo<Linktree>(
    () => createLinktreeTemplatePreview({ templateId, description: copy.previewDescription, subtitle: copy.previewSubtitle }),
    [templateId, copy.previewDescription, copy.previewSubtitle],
  );
  const sampleLinks = useMemo(() => createBusinessContactPreviewLinks(undefined, {
    whatsapp: copy.previewWhatsapp, viber: copy.previewViber, phone: copy.previewPhone,
  }), [copy.previewWhatsapp, copy.previewViber, copy.previewPhone]);

  const darkTheme = useMemo(() => {
    return LINKTREE_TEMPLATE_PREVIEW_THEMES[templateId].from !== "#ffffff";
  }, [templateId]);

  return (
    <TemplatePhonePreview
      name={templateName}
      ariaLabel={`${templateName} ${copy.mobilePreview}`}
      darkTheme={darkTheme}
      locked={locked}
      lockedLabel={copy.locked}
    >
      {(isNear) =>
        isNear ? (
          <div
            className="h-full overflow-hidden"
            style={
              {
                "--business-website-color": "#25F4EE",
              } as CSSProperties
            }
          >
            <DynamicTemplate
              linktree={linktree}
              links={sampleLinks}
              theme={LINKTREE_TEMPLATE_PREVIEW_THEMES[templateId]}
              onLinkClick={(_linkId: string, url: string) => {
                window.open(url, "_blank", "noopener,noreferrer");
              }}
            />
          </div>
        ) : (
          <TemplatePreviewSkeleton />
        )
      }
    </TemplatePhonePreview>
  );
});

