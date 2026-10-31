"use client";

import { memo, type CSSProperties, type ReactNode } from "react";
import { BackgroundPattern } from "@/lib/templates/background-pattern";
import type { BackgroundPatternStyle } from "@linktree/types";
import { useTemplateMedia } from "./TemplateMediaContext";
import { LinktreeLegalFooter } from "./LinktreeLegalFooter";
import footerStyles from "./LinktreeLegalFooter.module.css";
import { PublicLinktreeBusinessDetails } from "@/components/public/PublicLinktreeBusinessDetails";
import { usePublicLinktreeLocale } from "@/features/business/i18n/public-linktree";
import { TemplateBanner } from "./TemplateBanner";
import { useTemplateViewportFit } from "./useTemplateViewportFit";

export interface TemplateViewportLayoutProps {
  isPreview: boolean;
  className?: string;
  style?: CSSProperties;
  dir?: "ltr" | "rtl";
  header: ReactNode;
  main: ReactNode;
  footer?: ReactNode;
  /** Repeating pattern painted over the surface, under the content. */
  backgroundPattern?: BackgroundPatternStyle | null;
  /** Colour the pattern is stroked in. Defaults to the page text colour. */
  backgroundPatternAccent?: string;
  /** Optional visual-strength multiplier for templates with ambient overlays. */
  backgroundPatternOpacityScale?: number;
}

/**
 * Shared three-region template frame. It fills the real viewport on public
 * pages and the simulated viewport in device previews. Header, actions, and
 * content adapts to the available screen, with readable scrolling for long pages.
 */
export const TemplateViewportLayout = memo(function TemplateViewportLayout({
  isPreview,
  className = "",
  style,
  dir,
  header,
  main,
  footer,
  backgroundPattern = null,
  backgroundPatternAccent = "#ffffff",
  backgroundPatternOpacityScale = 1,
}: TemplateViewportLayoutProps) {
  const { hasBanner, seo, sponsor } = useTemplateMedia();
  const locale = usePublicLinktreeLocale();
  const { viewportRef, frameRef, contentRef } = useTemplateViewportFit();
  return (
    <div
      ref={viewportRef}
      className={`${footerStyles.viewport} ${sponsor?.enabled && (sponsor.style === "wordmark" ? sponsor.logo : sponsor.name) ? footerStyles.sponsoredViewport : ""} relative w-full ${isPreview ? "min-h-full" : "min-h-[100svh] min-h-[100dvh]"} ${className} ${hasBanner ? "!px-0 !pt-0" : ""}`.trim()}
      style={style}
      dir={dir}
      data-template-viewport-layout
      data-preview={isPreview}
      data-has-banner={hasBanner}
    >
      {backgroundPattern && backgroundPattern !== "none" && (
        // `fixed` rather than `absolute`: the layout scrolls, and a pattern
        // that scrolls with it reads as a moving texture instead of a surface.
        <BackgroundPattern
          accent={backgroundPatternAccent}
          className={`pointer-events-none ${isPreview ? "absolute" : "fixed"} inset-0 h-full w-full`}
          opacityScale={backgroundPatternOpacityScale}
          style={backgroundPattern}
        />
      )}
      <div ref={frameRef} className={`${footerStyles.fitFrame} relative z-10 w-full`}>
        <div ref={contentRef} className={footerStyles.fitContent}>
          <TemplateBanner />
          <div className={`mx-auto w-full max-w-md${hasBanner ? " px-4" : ""}`}>{header}</div>
          <main className={`${footerStyles.main} w-full${hasBanner ? " px-4 sm:px-6 md:px-8" : ""}`}>
            <div className="mx-auto w-full max-w-md">{main}</div>
          </main>
          <div className="mx-auto w-full max-w-md px-4">
            <PublicLinktreeBusinessDetails seo={seo} locale={locale} color={backgroundPatternAccent} />
          </div>
          {footer ? <div className="mx-auto w-full max-w-md">{footer}</div> : null}
        </div>
      </div>
      <LinktreeLegalFooter color={backgroundPatternAccent} />
    </div>
  );
});
