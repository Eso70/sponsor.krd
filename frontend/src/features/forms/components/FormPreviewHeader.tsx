import type { ReactNode } from "react";
import { Clock3 } from "lucide-react";
import type { FormDraft } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { isFormImage } from "../form-media";
import { FormMediaPreview } from "./FormMediaPreview";
import { FormCompletionPreview } from "./FormCompletionPreview";
import styles from "./FormPreview.module.css";

/** Shared banner, avatar, introduction and completion typography. */
export function FormPreviewHeader({
  form,
  copy,
  labels,
  placeholders,
  showFinal = false,
  backdrop = false,
  questionCount = 0,
  publicPage = false,
  children,
}: {
  form: FormDraft;
  copy: FormsCopy;
  labels: FormEditorCopy;
  placeholders: boolean;
  showFinal?: boolean;
  backdrop?: boolean;
  questionCount?: number;
  publicPage?: boolean;
  children?: ReactNode;
}) {
  const Heading = publicPage ? "h1" : "h3";
  const images = form.bannerImages?.length
    ? form.bannerImages
    : form.banner
      ? [form.banner]
      : [];
  const banner =
    !backdrop &&
    form.bannerEnabled !== false &&
    (placeholders || images.some(isFormImage));
  const logo =
    !showFinal &&
    form.logoEnabled !== false &&
    (placeholders || isFormImage(form.logo));
  const avatar = (
    <FormMediaPreview
      images={form.logo ? [form.logo] : []}
      placeholder={placeholders}
      logo
      largeLogo={!banner}
      copy={copy}
    />
  );
  return (
    <>
      {banner && (
        <div className={`${styles.banner} relative shrink-0`}>
          <FormMediaPreview
            banner
            eager={publicPage && !showFinal}
            images={images}
            carousel={form.bannerMode === "carousel"}
            placeholder={placeholders}
            copy={copy}
          />
          {logo && (
            <div className="absolute inset-x-0 bottom-0 flex translate-y-1/2 justify-center">
              <div className={styles.logo}>{avatar}</div>
            </div>
          )}
        </div>
      )}
      <div
        className={`${styles.introduction} ${backdrop ? styles.backdropIntroduction : ""} ${banner && logo ? styles.withBannerLogo : ""} ${
          showFinal
            ? "flex min-h-56 flex-1 items-center justify-center p-4"
            : backdrop
              ? "mt-auto space-y-3 p-5"
              : `space-y-3 p-4 ${banner && logo ? "pt-8" : ""}`
        }`}
      >
        {showFinal ? (
          <FormCompletionPreview
            form={form}
            copy={copy}
            labels={labels}
            placeholders={placeholders}
            publicPage={publicPage}
          />
        ) : (
          <>
            <div
              className={`${styles.introductionHeading} flex flex-col items-center space-y-2 text-center`}
            >
              {logo && !banner && avatar}
              {(form.headline || placeholders) && (
                <Heading className="break-words text-base font-bold">
                  {form.headline || copy.title}
                </Heading>
              )}
              {(form.description || placeholders) && (
                <p className="whitespace-pre-wrap break-words text-xs leading-5 opacity-75">
                  {form.description || labels.descriptionHint}
                </p>
              )}
              {form.slogan && (
                <p
                  className={`${styles.slogan} max-w-full whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-xs font-semibold`}
                >
                  {form.slogan}
                </p>
              )}
              {form.displayTimeEstimate && (
                <p className="flex items-center gap-1.5 text-xs opacity-75">
                  <Clock3 aria-hidden className="size-3.5" />
                  {Math.max(1, Math.ceil((questionCount * 20) / 60))}{" "}
                  {labels.minutes}
                </p>
              )}
            </div>
            {children}
          </>
        )}
      </div>
    </>
  );
}
