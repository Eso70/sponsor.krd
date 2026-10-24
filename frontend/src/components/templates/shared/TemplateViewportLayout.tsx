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
 * footer remain in normal document flow so their positions adapt naturally
 * to their content. Taller content grows and remains scrollable.
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
  const { hasBanner, seo } = useTemplateMedia();
  const locale = usePublicLinktreeLocale();
  return (
    <div
      className={`${footerStyles.viewport} relative w-full overflow-y-auto ${isPreview ? "min-h-full" : "min-h-screen min-h-[100svh] min-h-[100dvh]"} ${className} ${hasBanner ? "!px-0 !pt-0" : ""}`.trim()}
      style={style}
      dir={dir}
      data-template-viewport-layout
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
      <div className="relative z-10 w-full">
        <TemplateBanner />
        <div className={`mx-auto w-full max-w-md${hasBanner ? " px-4" : ""}`}>{header}</div>
        <main className={`w-full py-6${hasBanner ? " px-4 sm:px-6 md:px-8" : ""}`}>
          <div className="mx-auto w-full max-w-md">{main}</div>
        </main>
        <div className="mx-auto w-full max-w-md px-4">
          <PublicLinktreeBusinessDetails seo={seo} locale={locale} color={backgroundPatternAccent} />
        </div>
        {footer ? <div className="mx-auto w-full max-w-md">{footer}</div> : null}
        <LinktreeLegalFooter color={backgroundPatternAccent} />
      </div>
    </div>
  );
});
