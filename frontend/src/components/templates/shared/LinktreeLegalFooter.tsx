"use client";
import { useEffect, useRef } from "react";
import { useTemplateMedia } from "./TemplateMediaContext";
import { LinktreeSponsor } from "./LinktreeSponsor";
import { LegalLinks } from "@/components/shared/LegalLinks";
import styles from "./LinktreeLegalFooter.module.css";

/** Legal navigation anchored to the fitted page, after content on long pages. */
export function LinktreeLegalFooter({ color }: { color: string }) {
  const { sponsor, preview, onSponsorClick } = useTemplateMedia();
  const footerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const footer = footerRef.current;
    const viewport = footer?.closest<HTMLElement>("[data-template-viewport-layout]");
    if (!footer || !viewport) return;
    const measure = () => {
      const height = footer.getBoundingClientRect().height;
      if (height > 0) viewport.style.setProperty("--linktree-footer-height", `${Math.ceil(height) + 12}px`);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(footer);
    return () => { observer?.disconnect(); viewport.style.removeProperty("--linktree-footer-height"); };
  }, []);
  return <footer ref={footerRef} data-linktree-footer className={styles.footer} lang="en" dir="ltr" style={{ color }}>
    <div className={styles.content}>
      {sponsor && <LinktreeSponsor sponsor={sponsor} preview={preview} onClick={onSponsorClick} />}
      <LegalLinks language="en" privacyLabel="Privacy" termsLabel="Terms" subtle />
    </div>
  </footer>;
}
