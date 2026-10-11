import type { ReactNode } from "react";
import type { FormDraft, FormLanguage } from "../types";
import { formPreviewStyle } from "../form-preview-style";
import { FormPreviewBackdrop } from "./FormPreviewBackdrop";
import styles from "./FormPreview.module.css";

/** One isolated preview palette and device shell for both layouts. */
export function FormPreviewSurface({
  children,
  language,
  appearance,
  color,
  scrollable,
  card = false,
  backgroundImage,
  navigation,
  presentation = "preview",
}: {
  children: ReactNode;
  presentation?: "preview" | "public";
  language: FormLanguage;
  appearance: FormDraft["appearance"];
  color: string;
  scrollable: boolean;
  card?: boolean;
  backgroundImage?: string;
  navigation?: ReactNode;
}) {
  return (
    <div
      className={`${presentation === "public" ? styles.publicPreview : "mx-auto w-full max-w-sm"} ${scrollable ? "flex min-h-0 flex-1 flex-col" : ""}`}
    >
      {navigation}
      <div
        data-form-presentation={presentation}
        data-form-preview
        data-card-preview={card || undefined}
        data-appearance={appearance}
        dir={language === "en" ? "ltr" : "rtl"}
        lang={language}
        style={formPreviewStyle(color)}
        className={`${styles.surface} ${presentation === "public" ? styles.publicSurface : ""} ${card ? styles.cardFrame : ""} relative isolate flex flex-col overflow-hidden rounded-2xl border shadow-sm ${scrollable ? "min-h-0 flex-1" : card ? "min-h-[480px]" : ""}`}
      >
        {card && (
          <FormPreviewBackdrop
            image={backgroundImage}
            eager={presentation === "public"}
          />
        )}
        {children}
      </div>
    </div>
  );
}
