"use client";
import { useFormSubmission } from "../use-form-submission";
import { FormRequestError } from "./FormRequestError";
import { useId } from "react";
import type { FormPreviewProps } from "./FormPreview";
import { formsCopy } from "../forms-copy";
import { formEditorCopy } from "../form-editor-copy";
import { formContentOrder } from "../form-content-order";
import { visibleFormQuestions } from "../form-card-pages";
import { FormQuestionsPreview } from "./FormQuestionsPreview";
import { FormBlockPreview } from "./FormBlockPreview";
import { FormPreviewFooter } from "./FormPreviewFooter";
import { FormPreviewSurface } from "./FormPreviewSurface";
import { FormPreviewHeader } from "./FormPreviewHeader";
import { useFormPreviewResponses } from "../use-form-preview-responses";
import { useFormPreviewNavigation } from "../use-form-preview-navigation";
import { FormPreviewNavigation } from "./FormPreviewNavigation";
import { canSubmitQuestions } from "../form-preview-answers";
/** Same draft model as the editor; responses exist only for this preview instance. */
export function FormFlowPreview({
  form,
  onSubmit,
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
  const copy = formsCopy(language);
  const labels = formEditorCopy(language);
  const id = useId();
  const {
    answers,
    setAnswers,
    phoneCountryCodes,
    setPhoneCountryCodes,
    consent,
    setConsent,
  } = useFormPreviewResponses(form);
  const submission = useFormSubmission(onSubmit);
  const visibleQuestions = visibleFormQuestions(form, answers);
  const { currentIndex, contentRef, goTo } = useFormPreviewNavigation(
    ["content", "final"],
    finalPage,
    presentation === "public",
  );
  const showFinal = currentIndex === 1;
  return (
    <FormPreviewSurface
      presentation={presentation}
      language={language}
      appearance={appearance}
      color={color}
      scrollable={scrollable}
      navigation={
        !onSubmit && (
          <FormPreviewNavigation
            currentIndex={currentIndex}
            pageCount={2}
            labels={labels}
            onPrevious={() => goTo("content")}
            onNext={() => goTo("final")}
          />
        )
      }
    >
      <div
        className={
          scrollable
            ? `min-h-0 flex-1 overflow-y-auto overscroll-contain ${showFinal ? "flex flex-col" : ""}`
            : showFinal
              ? "flex flex-1 flex-col"
              : presentation === "public"
                ? "flex-1"
                : ""
        }
        ref={contentRef}
        tabIndex={scrollable ? 0 : -1}
        role="region"
        aria-label={copy.preview}
      >
        <FormPreviewHeader
          publicPage={presentation === "public"}
          form={form}
          copy={copy}
          labels={labels}
          placeholders={placeholders}
          showFinal={showFinal}
          questionCount={visibleQuestions.length}
        >
          {formContentOrder(form).map((sectionId) => {
            if (sectionId === "questions")
              return (
                <FormQuestionsPreview
                  key={sectionId}
                  form={form}
                  copy={copy}
                  labels={labels}
                  id={id}
                  language={language}
                  placeholders={placeholders}
                  visibleQuestions={visibleQuestions}
                  questions={visibleQuestions}
                  answers={answers}
                  setAnswers={setAnswers}
                  phoneCountryCodes={phoneCountryCodes}
                  setPhoneCountryCodes={setPhoneCountryCodes}
                  onAdvance={() => {
                    void submission.submit(
                      { answers, phoneCountryCodes, consent },
                      () => goTo("final"),
                    );
                  }}
                />
              );
            const block = form.blocks.find((entry) => entry.id === sectionId);
            return block ? (
              <FormBlockPreview
                key={block.id}
                block={block}
                copy={copy}
                labels={labels}
                placeholders={placeholders}
              />
            ) : null;
          })}
        </FormPreviewHeader>
      </div>
      {submission.failed && (
        <FormRequestError
          message={submission.stale ? copy.formChanged : copy.submitError}
        />
      )}
      <FormPreviewFooter
        publicPage={presentation === "public"}
        completionFooter={completionFooter}
        onAction={onAction}
        consent={consent}
        onConsentChange={setConsent}
        language={language}
        form={form}
        copy={copy}
        labels={labels}
        formId={id}
        showFinal={showFinal}
        placeholders={placeholders}
        lastStep
        currentStep={0}
        canSubmit={
          !submission.busy &&
          (!form.consentRequired || consent) &&
          canSubmitQuestions(visibleQuestions, answers, phoneCountryCodes)
        }
      />
    </FormPreviewSurface>
  );
}
