"use client";
import { memo, useMemo, useState, type CSSProperties } from "react";
import { WhatsAppQuestionModal, type WhatsAppQuestion } from "@/components/public/WhatsAppQuestionModal";
import { DynamicTemplate } from "@/components/templates/DynamicTemplate";
import { FittedPhoneMockup } from "@/components/shared/FittedPhoneMockup";
import { PublicLinktreeLocaleProvider } from "@/features/business/i18n/public-linktree";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { parseWebsiteColor } from "@/lib/utils/parse-website-color";
import { buildLinktreeEditorPreview, type LinktreeEditorPreviewDraft } from "../editor-preview";
import { readLinktreeSeo } from "@linktree/types/linktree-seo.cjs";

export interface LinktreeWhatsAppPreview {
  enabled: boolean;
  open: boolean;
  title: string;
  subtitle: string;
  questions: WhatsAppQuestion[];
  onClose: () => void;
}
export const LinktreeEditorPreview = memo(function LinktreeEditorPreview({ draft, locale, label, whatsappPreview }: {
  draft: LinktreeEditorPreviewDraft;
  locale: BusinessLocale;
  label: string;
  whatsappPreview?: LinktreeWhatsAppPreview;
}) {
  const [questionPreviewOpen, setQuestionPreviewOpen] = useState(false);
  const presentation = useMemo(() => buildLinktreeEditorPreview(draft), [draft]);
  const accent = useMemo(() => parseWebsiteColor(draft.accentColor), [draft.accentColor]);
  const language = readLinktreeSeo(draft.templateConfig.seo)?.language;
  const previewLocale = language && language !== "auto" ? language : locale;
  return (
    <FittedPhoneMockup ariaLabel={label} name={draft.name} statusBarClassName="mix-blend-difference !text-white">
      <PublicLinktreeLocaleProvider locale={previewLocale}>
        <div data-linktree-editor-preview lang={previewLocale} dir={previewLocale === "en" ? "ltr" : "rtl"} className="min-h-full" style={{ "--business-website-color": accent.primary, "--business-website-css": accent.css } as CSSProperties}
          onClickCapture={(event) => {
            if (!event.currentTarget.contains(event.target as Node) || (event.target as Element).closest("[data-image-preview-trigger], [data-media-control], [data-whatsapp-preview]")) return;
            // Keep navigation and button actions inside the preview.
            if ((event.target as Element).closest("a, button")) {
              const link = (event.target as Element).closest("a");
              if (whatsappPreview?.enabled && link?.getAttribute("href")?.startsWith("https://wa.me/")) setQuestionPreviewOpen(true);
              event.preventDefault(); event.stopPropagation();
            }
          }}>
          <DynamicTemplate {...presentation} onLinkClick={() => undefined} />
          {whatsappPreview?.enabled && <div data-whatsapp-preview>
            <WhatsAppQuestionModal embedded isOpen={whatsappPreview.open || questionPreviewOpen}
              title={whatsappPreview.title} subtitle={whatsappPreview.subtitle} questions={whatsappPreview.questions}
              appearance={presentation.theme.text === "#ffffff" ? "dark" : "light"} accentColor={draft.accentColor}
              whatsappUrl="" onSelectQuestion={() => undefined}
              onClose={() => { setQuestionPreviewOpen(false); whatsappPreview.onClose(); }} />
          </div>}
        </div>
      </PublicLinktreeLocaleProvider>
    </FittedPhoneMockup>
  );
});
