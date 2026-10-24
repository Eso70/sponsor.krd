"use client";
import { EditorField } from "./EditorField";
import { ModalTextInput } from "./ModalTextInput";
import {
  EDITOR_FIELD_CLASS,
  EDITOR_INPUT_CLASS,
} from "./editor-control-styles";
import { SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
import {
  businessMessages,
  type BusinessLocale,
} from "@/features/business/i18n/messages";
import type { usePageDuplicateSlug } from "@/hooks/usePageDuplicateSlug";

const copy = {
  en: {
    checking: "Checking slug...",
    failed: "Couldn't check this slug. Try again.",
    retry: "Try again",
  },
  ar: {
    checking: "جارٍ التحقق من المعرّف...",
    failed: "تعذّر التحقق من المعرّف. حاول مجددًا.",
    retry: "حاول مجددًا",
  },
  ckb: {
    checking: "نازناو دەپشکنرێت...",
    failed: "پشکنینی نازناو سەرکەوتوو نەبوو. دووبارە هەوڵ بدەوە.",
    retry: "دووبارە هەوڵ بدەوە",
  },
};
/** Identical address editing for saved-page copies in both dashboards. */
export function DuplicateSlugField({
  check,
  locale,
  pageType,
  onChange,
}: {
  check: ReturnType<typeof usePageDuplicateSlug>;
  locale: BusinessLocale;
  pageType: "form" | "linktree";
  onChange?: () => void;
}) {
  const labels = businessMessages[locale].DuplicateLinktree;
  const text = copy[locale];
  const error =
    check.status === "taken"
      ? labels.slugTaken
      : check.status === "invalid"
        ? check.slug.length < 2
          ? labels.slugTooShort
          : labels.slugInvalid
        : undefined;
  return (
    <EditorField
      label={labels.slugLabel}
      required
      className={EDITOR_FIELD_CLASS}
      error={error}
    >
      <ModalTextInput
        value={check.slug}
        onChange={(event) => {
          check.setSlug(event.target.value);
          onChange?.();
        }}
        aria-label={labels.slugLabel}
        placeholder={labels.slugLabel}
        maxLength={50}
        dir="ltr"
        className={EDITOR_INPUT_CLASS}
        aria-invalid={!!error}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
      <p
        role="status"
        className="mt-2 text-xs text-slate-500 dark:text-slate-400"
      >
        {check.status === "checking"
          ? text.checking
          : check.status === "available"
            ? labels.slugAvailable
            : check.status === "error"
              ? text.failed
              : ""}
      </p>
      {check.status === "error" && (
        <button
          type="button"
          onClick={check.retry}
          className={`${SHARED_SOFT_BUTTON_CLASS} mt-2 px-3 py-1 text-xs`}
        >
          {text.retry}
        </button>
      )}
      {check.slug && (
        <p className="mt-2 break-all text-xs text-slate-500 dark:text-slate-400">
          {labels.publicLink}{" "}
          <bdi dir="ltr">
            /{pageType}/{check.slug}
          </bdi>
        </p>
      )}
    </EditorField>
  );
}
