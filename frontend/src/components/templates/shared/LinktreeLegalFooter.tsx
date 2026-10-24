import { LegalLinks } from "@/components/shared/LegalLinks";
import styles from "./LinktreeLegalFooter.module.css";

/** Fixed, minimal legal navigation over the existing page surface. */
export function LinktreeLegalFooter({ color }: { color: string }) {
  return <footer data-linktree-footer className={styles.footer} lang="en" dir="ltr" style={{ color }}>
    <div className={styles.content}>
      <LegalLinks language="en" privacyLabel="Privacy" termsLabel="Terms" subtle />
    </div>
  </footer>;
}
