"use client";
import { useFormSubmission } from "../use-form-submission";
import { FormRequestError } from "./FormRequestError";
import { useId } from "react";
import type { FormPreviewProps } from "./FormPreview";
import { formsCopy } from "../forms-copy";
import { formEditorCopy } from "../form-editor-copy";
import { visibleFormQuestions, formCardPages } from "../form-card-pages";
import { FormQuestionsPreview } from "./FormQuestionsPreview";
import { FormPreviewButton } from "./FormPreviewButton";
import { FormPreviewFooter } from "./FormPreviewFooter";
import { FormPreviewSurface } from "./FormPreviewSurface";
import { FormPreviewHeader } from "./FormPreviewHeader";
import { useFormPreviewResponses } from "../use-form-preview-responses";
import { useFormPreviewNavigation } from "../use-form-preview-navigation";
import { FormPreviewNavigation } from "./FormPreviewNavigation";
import { canPreviewQuestions } from "../form-preview-answers";
export function FormCardPreview({
  form,
  onSubmit,
  onStart,
  onAction,
  completionFooter,
  finalPage = false,
  language = form.language,
  appearance = form.appearance,
  color = form.color || "#16a34a",
  placeholders = false,
  scrollable = false,
  presentation = "preview",
}: FormPreviewProps) {
  const copy = formsCopy(language),
    labels = formEditorCopy(language),
    id = useId();
  const {
    answers,
    setAnswers,
    phoneCountryCodes,
    setPhoneCountryCodes,
    consent,
    setConsent,
  } = useFormPreviewResponses(form);
  const submission = useFormSubmission(onSubmit);
  const questions = visibleFormQuestions(form, answers);
  const pages = formCardPages(questions);
  const allIds = ["welcome", ...pages.map((page) => page.id), "final"];
  const { currentIndex, contentRef, goTo } = useFormPreviewNavigation(
    allIds,
    finalPage,
  );
  const welcome = currentIndex === 0,
    final = currentIndex === allIds.length - 1;
  const page = pages[currentIndex - 1];
  const advance = () => {
    if (welcome) onStart?.();
    if (currentIndex === pages.length) {
      void submission.submit({ answers, phoneCountryCodes, consent }, () =>
        goTo("final"),
      );
    } else goTo(allIds[currentIndex + 1] ?? "final");
  };
  return (
    <FormPreviewSurface
      presentation={presentation}
      language={language}
      appearance={appearance}
      color={color}
      scrollable={scrollable}
      card
      navigation={
        !onSubmit && (
          <FormPreviewNavigation
            currentIndex={currentIndex}
            pageCount={allIds.length}
            labels={labels}
            onPrevious={() => goTo(allIds[currentIndex - 1])}
            onNext={() => goTo(allIds[currentIndex + 1])}
          />
        )
      }
      backgroundImage={
        form.bannerEnabled !== false
          ? form.bannerImages?.[0] || form.banner
          : undefined
      }
    >
      {!welcome && !final && (
        <div data-form-progress className="mx-4 mt-4 shrink-0 space-y-2">
          <div
            className="h-1 overflow-hidden rounded-full bg-[var(--preview-border)]"
            role="progressbar"
            aria-label={copy.questions}
            aria-valuemin={0}
            aria-valuemax={pages.length}
            aria-valuenow={currentIndex}
          >
            <div
              className="theme-fill h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none"
              style={{
                width: `${(currentIndex / Math.max(1, pages.length)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
      <div
        className={`min-h-0 overflow-y-auto overscroll-contain ${welcome || final ? "flex flex-1 flex-col" : "m-3 flex-initial rounded-xl p-4"}`}
        style={
          !welcome && !final
            ? { background: "var(--preview-surface)" }
            : undefined
        }
        ref={contentRef}
        tabIndex={-1}
        role="region"
        aria-label={copy.preview}
      >
        {welcome || final ? (
          <FormPreviewHeader
            publicPage={presentation === "public"}
            form={form}
            copy={copy}
            labels={labels}
            placeholders={placeholders}
            showFinal={final}
            questionCount={questions.length}
            backdrop
          />
        ) : page ? (
          <div className="space-y-4">
            {page.personal && (
              <div className="space-y-1">
                <h3 className="break-words text-base font-bold">
                  {form.personalCardTitle || labels.personalCardHint}
                </h3>
                {form.personalCardDescription && (
                  <p className="whitespace-pre-wrap text-xs opacity-75">
                    {form.personalCardDescription}
                  </p>
                )}
              </div>
            )}
            <FormQuestionsPreview
              form={form}
              copy={copy}
              labels={labels}
              id={id}
              language={language}
              placeholders={placeholders}
              visibleQuestions={questions}
              questions={page.questions}
              answers={answers}
              setAnswers={setAnswers}
              phoneCountryCodes={phoneCountryCodes}
              setPhoneCountryCodes={setPhoneCountryCodes}
              onAdvance={advance}
            />
          </div>
        ) : null}
      </div>
      {welcome ? (
        <footer className="shrink-0 p-3">
          <FormPreviewButton
            type="button"
            disabled={!pages.length}
            onClick={advance}
          >
            {labels.start}
          </FormPreviewButton>
        </footer>
      ) : (
        <div className="mt-auto">
          {submission.failed && (
            <FormRequestError
              message={submission.stale ? copy.formChanged : copy.submitError}
            />
          )}
          <FormPreviewFooter
            publicPage={presentation === "public"}
            completionFooter={completionFooter}
            form={form}
            language={language}
            copy={copy}
            labels={labels}
            formId={id}
            showFinal={final}
            placeholders={placeholders}
            lastStep={currentIndex === pages.length}
            currentStep={currentIndex}
            canSubmit={
              !submission.busy && canPreviewQuestions(page?.questions ?? [])
            }
            onBack={() => goTo(allIds[currentIndex - 1])}
            onAction={onAction}
            consent={consent}
            onConsentChange={setConsent}
          />
        </div>
      )}
    </FormPreviewSurface>
  );
}
