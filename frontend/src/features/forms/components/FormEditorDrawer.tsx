"use client";

import { FormUploadError, formUploadIssues } from "../form-upload-error";
import { ApiRequestError } from "@/lib/api/request";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { ImageCropEditorSkeleton } from "@/components/shared/ImageCropEditorSkeleton";
import { ManagementDrawer } from "@/components/shared/ManagementDrawer";
import { ModalStepActions } from "@/components/shared/ModalStepActions";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { FormRequestError } from "./FormRequestError";
import { FormPreview } from "./FormPreview";
import { FormLayoutChooser } from "./FormLayoutChooser";
import { FormBuilder } from "./FormBuilder";
import { createForm, formDraftName } from "../forms-model";
import { FormEditorSkeleton } from "./FormSkeletons";
import {
  formEditorIssues,
  type FormEditorIssue,
} from "../form-editor-validation";
import { FormValidationContext } from "./FormValidationContext";
import { FormValidationSummary } from "./FormValidationSummary";
import type { FormsCopy } from "../forms-copy";
import type { FormDraft } from "../types";
import { formsApi, type FormsScope } from "../api";
import { useFormTitleAvailability } from "../use-form-title-availability";
import dynamic from "next/dynamic";
import {
  FormImageCropContext,
  type FormImageCropRequest,
} from "./FormImageCropContext";

const ImageCropEditor = dynamic(() =>
  import("@/components/shared/ImageCropEditor").then(
    (module) => module.ImageCropEditor,
  ),
);

export function FormEditorDrawer({
  initialForm,
  onSave,
  onClose,
  copy,
  accentColor,
  previewOnly = false,
  isNew = false,
  headerControls,
  direction = "ltr",
  scope = "business",
}: {
  scope?: FormsScope;
  initialForm: FormDraft | null;
  onSave: (form: FormDraft) => void | Promise<void>;
  onClose: () => void;
  copy: FormsCopy;
  accentColor?: string | null;
  previewOnly?: boolean;
  isNew?: boolean;
  headerControls?: ReactNode;
  direction?: "ltr" | "rtl";
}) {
  const saveLock = useRef(false);
  const [saving, setSaving] = useState(false);
  const [cropRequest, setCropRequest] = useState<FormImageCropRequest | null>(
    null,
  );
  const [cropBusy, setCropBusy] = useState(false);
  const [cropFooter, setCropFooter] = useState<HTMLDivElement | null>(null);
  const cancelCrop = () => {
    const target = cropRequest?.returnFocus;
    setCropRequest(null);
    requestAnimationFrame(() => target?.focus({ preventScroll: true }));
  };
  const [failedImage, setFailedImage] = useState<{
    image: string;
    message: string;
  } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<FormEditorIssue | null>(
    null,
  );
  const [emptyForm] = useState(() => initialForm ?? createForm());
  const [editedForm, setEditedForm] = useState<FormDraft | null>(null);
  const form = editedForm ?? initialForm ?? emptyForm;
  const [step, setStep] = useState<"layout" | "editor">(
    isNew && !previewOnly ? "layout" : "editor",
  );
  const [selectedLayout, setSelectedLayout] = useState<FormDraft["layout"]>(
    initialForm?.layout ?? "form",
  );
  const [discard, setDiscard] = useState(false);
  const fittedBody = step === "editor";
  const contentRef = useRef<HTMLDivElement>(null);
  const loading = !initialForm;
  const titleAvailability = useFormTitleAvailability(
    scope,
    form.name,
    isNew ? undefined : form.id,
    !loading && step === "editor" && !previewOnly,
  );
  const [titleConflict, setTitleConflict] = useState<string | null>(null);
  useEffect(() => {
    if (!loading) contentRef.current?.focus({ preventScroll: true });
  }, [step, loading]);
  const close = () => {
    if (saving || cropBusy) return;
    if (cropRequest) {
      cancelCrop();
      return;
    }
    if (loading) {
      onClose();
      return;
    }
    if (!previewOnly && JSON.stringify(form) !== JSON.stringify(initialForm))
      setDiscard(true);
    else onClose();
  };
  const issues = formEditorIssues(form, copy);
  if (titleAvailability.status === "taken" || titleConflict === form.name)
    issues.unshift({
      field: "name",
      section: "title",
      message: copy.titleTaken,
    });
  const uploadIssues = failedImage
    ? formUploadIssues(form, failedImage.image, copy)
    : [];
  const save = async () => {
    if (step !== "editor" || saveLock.current) return;
    setAttempted(true);
    setSaveError(null);
    setFailedImage(null);
    if (issues.length) {
      setSelectedIssue(issues[0]);
      return;
    }
    setSelectedIssue(null);
    saveLock.current = true;
    setSaving(true);

    try {
      const available = await formsApi.titleAvailability(
        scope,
        form.name.trim(),
        isNew ? undefined : form.id,
      );
      if (!available.available) {
        setTitleConflict(form.name);
        setSelectedIssue({
          field: "name",
          section: "title",
          message: copy.titleTaken,
        });
        return;
      }
      await onSave({
        ...form,
        name: formDraftName(form),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      const requestError =
        error instanceof FormUploadError ? error.cause : error;
      const status =
        requestError instanceof ApiRequestError ? requestError.status : 0;
      if (error instanceof FormUploadError) {
        const message =
          status === 401
            ? copy.saveSessionError
            : status === 403
              ? copy.savePermissionError
              : status === 429
                ? copy.saveRateError
                : copy.saveImageError;
        setFailedImage({ image: error.image, message });
        setSelectedIssue(formUploadIssues(form, error.image, copy)[0] ?? null);
      } else if (
        requestError instanceof ApiRequestError &&
        requestError.code === "FORM_TITLE_TAKEN"
      ) {
        setTitleConflict(form.name);
        setSelectedIssue({
          field: "name",
          section: "title",
          message: copy.titleTaken,
        });
      } else {
        setSaveError(
          status === 409
            ? copy.saveConflict
            : status === 401
              ? copy.saveSessionError
              : status === 403
                ? copy.savePermissionError
                : status === 413
                  ? copy.saveImageError
                  : status === 429
                    ? copy.saveRateError
                    : status === 400
                      ? copy.saveInvalid
                      : copy.saveError,
        );
      }
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  };
  const next = () => {
    setEditedForm((current) => ({
      ...(current ?? form),
      layout: selectedLayout,
    }));
    setStep("editor");
  };
  const back = () => {
    if (saveLock.current) return;
    setSelectedLayout(form.layout);
    setStep("layout");
  };
  return (
    <>
      <ManagementDrawer
        isOpen
        onClose={close}
        busy={saving || cropBusy}
        title={
          cropRequest
            ? copy.imageCrop.title
            : previewOnly
              ? copy.preview
              : step === "layout"
                ? copy.chooseLayout
                : copy.editor
        }
        description={
          loading || cropRequest
            ? undefined
            : step === "layout"
              ? copy.chooseLayoutDescription
              : copy.local
        }
        extraWide
        compactHeader
        accentColor={accentColor}
        closeLabel={copy.close}
        headerAction={headerControls}
        bodyLayout={
          step === "layout" ? "centered" : fittedBody ? "contained" : "scroll"
        }
        footer={
          cropRequest ? (
            <div
              ref={setCropFooter}
              data-crop-footer
              className="flex w-full gap-3"
              dir={direction}
            />
          ) : loading ? undefined : previewOnly ? (
            <ModalStepActions primaryLabel={copy.close} onPrimary={onClose} />
          ) : step === "layout" ? (
            <ModalStepActions primaryLabel={copy.next} onPrimary={next} />
          ) : (
            <div className="w-full space-y-3" dir={direction}>
              {saveError && <FormRequestError message={saveError} />}
              {failedImage && uploadIssues.length > 0 && (
                <div
                  role="alert"
                  className="rounded-xl bg-rose-50 p-3 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200"
                >
                  <FormValidationSummary
                    issues={uploadIssues}
                    title={failedImage.message}
                    onSelect={setSelectedIssue}
                  />
                </div>
              )}
              {attempted && issues.length > 0 && (
                <div
                  role="alert"
                  className="max-h-32 overflow-y-auto text-rose-600 dark:text-rose-300"
                >
                  <FormValidationSummary
                    issues={issues}
                    title={copy.fixFields}
                    onSelect={setSelectedIssue}
                  />
                </div>
              )}
              <ModalStepActions
                primaryHint={
                  issues.length ? (
                    <FormValidationSummary
                      issues={issues}
                      title={copy.fixFields}
                    />
                  ) : undefined
                }
                backLabel={copy.back}
                onBack={saving ? undefined : back}
                primaryLabel={
                  saving ? copy.saving : isNew ? copy.create : copy.save
                }
                primaryDisabled={saving}
                onPrimary={() => {
                  void save();
                }}
              />
            </div>
          )
        }
      >
        <div
          ref={contentRef}
          tabIndex={-1}
          dir={direction}
          className={
            step === "layout"
              ? "my-auto w-full shrink-0 text-slate-700 outline-none dark:text-slate-200"
              : fittedBody
                ? "min-h-0 min-w-0 outline-none lg:h-full"
                : "min-w-0 outline-none"
          }
        >
          {loading ? (
            <FormEditorSkeleton
              label={copy.loading}
              copy={copy}
              previewOnly={previewOnly}
            />
          ) : previewOnly ? (
            <div className="flex h-[70dvh] min-h-0 lg:h-full">
              <FormPreview form={form} scrollable />
            </div>
          ) : step === "layout" ? (
            <FormLayoutChooser
              value={selectedLayout}
              onChange={setSelectedLayout}
              copy={copy}
            />
          ) : (
            <FormImageCropContext.Provider value={setCropRequest}>
              {cropRequest && (
                <div className="h-full overflow-y-auto pb-2">
                  <Suspense
                    fallback={
                      <ImageCropEditorSkeleton
                        copy={copy.imageCrop}
                        cancelLabel={copy.cancel}
                        onCancel={cancelCrop}
                        footerTarget={cropFooter}
                      />
                    }
                  >
                    <ImageCropEditor
                      src={cropRequest.src}
                      aspect={cropRequest.aspect}
                      maxEdge={cropRequest.maxEdge}
                      copy={copy.imageCrop}
                      cancelLabel={copy.cancel}
                      onClose={cancelCrop}
                      onBusyChange={setCropBusy}
                      footerTarget={cropFooter}
                      onConfirm={async (file) => {
                        await cropRequest.onConfirm(file);
                        cancelCrop();
                      }}
                    />
                  </Suspense>
                </div>
              )}
              <div
                hidden={!!cropRequest}
                className={cropRequest ? "hidden" : "contents"}
              >
                <fieldset
                  disabled={saving}
                  className="contents"
                  aria-busy={saving}
                >
                  <FormValidationContext.Provider
                    value={{
                      issues,
                      attempted,
                      failedImage,
                      selected: selectedIssue,
                      select: setSelectedIssue,
                    }}
                  >
                    <FormBuilder
                      form={form}
                      titleAvailability={titleAvailability}
                      onChange={(patch) =>
                        setEditedForm((current) => ({
                          ...(current ?? form),
                          ...patch,
                        }))
                      }
                      copy={copy}
                    />
                  </FormValidationContext.Provider>
                </fieldset>
              </div>
            </FormImageCropContext.Provider>
          )}
        </div>
      </ManagementDrawer>
      <ConfirmDeleteModal
        isOpen={discard}
        onClose={() => setDiscard(false)}
        onConfirm={async () => onClose()}
        title={copy.discard}
        message={copy.discardMessage}
        confirmLabel={copy.discardConfirm}
        cancelLabel={copy.cancel}
        closeLabel={copy.close}
        zIndexClassName="z-[160]"
      />
    </>
  );
}
