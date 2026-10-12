import type { FormEventHandler, ReactNode } from "react";
import type { FormDraft } from "../types";
import styles from "./FormPreview.module.css";

/** Responsive public canvas, also used while the form is loading. */
export function PublicFormShell({
  children,
  layout = "form",
  appearance,
  language,
  loadingLabel,
  onChangeCapture,
}: {
  children: ReactNode;
  layout?: FormDraft["layout"];
  appearance?: FormDraft["appearance"];
  language?: FormDraft["language"];
  loadingLabel?: string;
  onChangeCapture?: FormEventHandler<HTMLElement>;
}) {
  return (
    <main
      data-form-layout={layout}
      lang={language}
      data-appearance={appearance}
      className={styles.publicPage}
      onChangeCapture={onChangeCapture}
      role={loadingLabel ? "status" : undefined}
      aria-busy={loadingLabel ? true : undefined}
      aria-label={loadingLabel}
    >
      <div
        className={`${styles.publicContainer} ${layout === "card" ? styles.publicCardContainer : ""}`}
      >
        {children}
      </div>
    </main>
  );
}
