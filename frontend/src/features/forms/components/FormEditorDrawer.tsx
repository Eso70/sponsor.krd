"use client";

import { toast } from "sonner";
import { FormUploadError, formUploadIssues } from "../form-upload-error";
import { ApiRequestError } from "@/lib/api/request";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditorImageCropWorkspace } from "@/components/shared/EditorImageCropWorkspace";
import { useEditorImageCrop } from "@/hooks/useEditorImageCrop";
import { ManagementDrawer } from "@/components/shared/ManagementDrawer";
import { ModalStepActions } from "@/components/shared/ModalStepActions";
import { EditorPageActions } from "@/components/shared/EditorPageActions";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { FormRequestError } from "./FormRequestError";
import { FormPreview } from "./FormPreview";
import { FormLayoutChooser } from "./FormLayoutChooser";
import { FormBuilder } from "./FormBuilder";
import { createForm, duplicateForm, formDraftName } from "../forms-model";
import { formsCopy } from "../forms-copy";
import { businessMessages } from "@/features/business/i18n/messages";
import { DuplicateSlugField } from "@/components/shared/DuplicateSlugField";
import { usePageDuplicateSlug } from "@/hooks/usePageDuplicateSlug";
import {
  EditorMediaActivityContext,
  useEditorMediaBusy,
} from "@/components/shared/EditorMediaActivity";
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
import { FormImageCropContext } from "./FormImageCropContext";

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
  onManage,
  canDuplicate = true,
  onDuplicate,
}: {
  onManage?: (
    action: "status" | "archive",
    form: FormDraft,
  ) => Promise<FormDraft | void>;
  canDuplicate?: boolean;
  onDuplicate?: (id: string, form: FormDraft, slug: string) => Promise<void>;
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
  const [managementBusy, setManagementBusy] = useState(false);
  const media = useEditorMediaBusy();
  const {
    cropRequest,
    setCropRequest,
    cropBusy,
    setCropBusy,
    cropFooter,
    setCropFooter,
    cancelCrop,
  } = useEditorImageCrop();
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
  const [duplicateDraft, setDuplicateDraft] = useState<FormDraft | null>(null);
  const [duplicateSlug, setDuplicateSlug] = useState<string | undefined>();
  const duplicating = duplicateDraft !== null;
  const form = duplicateDraft ?? editedForm ?? initialForm ?? emptyForm;
  const locale =
    copy === formsCopy("en") ? "en" : copy === formsCopy("ar") ? "ar" : "ckb";
  const duplicateCopy = businessMessages[locale].DuplicateLinktree;
  const address = usePageDuplicateSlug(
    scope === "platform" ? "/api/platform/forms" : "/api/forms",
    initialForm?.id ?? "",
    { enabled: duplicating, initialSlug: duplicateSlug },
  );
  const resetValidation = () => {
    setAttempted(false);
    setSelectedIssue(null);
    setSaveError(null);
    setFailedImage(null);
    setTitleConflict(null);
  };
  const returnToSource = () => {
    setDuplicateDraft(null);
    setDuplicateSlug(undefined);
    address.reset();
    resetValidation();
  };
  const startDuplicate = async () => {
    if (
      !initialForm ||
      !onDuplicate ||
      saveLock.current ||
      managementBusy ||
      saving
    )
      return;
    saveLock.current = true;
    setManagementBusy(true);
    try {
      const options = await formsApi.duplicateOptions(scope, initialForm.id);
      if (!options.available || !/^[a-z0-9][a-z0-9-]{1,49}$/.test(options.slug))
        throw new Error("Invalid duplicate options");
      address.reset();
      setDuplicateSlug(options.slug);
      setDuplicateDraft({
        ...duplicateForm(options.form),
        name: options.name,
        slug: options.slug,
        revision: undefined,
        submissionCount: 0,
      });
      resetValidation();
    } catch (error) {
      console.error("Form duplicate setup failed:", error);
      setSaveError(copy.loadError);
      toast.error(copy.loadError);
    } finally {
      saveLock.current = false;
      setManagementBusy(false);
    }
  };
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
    !loading && step === "editor" && !previewOnly && !duplicating,
  );
  const [titleConflict, setTitleConflict] = useState<string | null>(null);
  useEffect(() => {
    if (!loading) contentRef.current?.focus({ preventScroll: true });
  }, [step, loading]);
  const close = () => {
    if (saving || cropBusy || managementBusy || media.busy) return;
    if (cropRequest) {
      cancelCrop();
      return;
    }
    if (duplicating) {
      returnToSource();
      return;
    }
    if (loading) {
      onClose();
      return;
    }
    if (
      !previewOnly &&
      JSON.stringify(form) !==
        JSON.stringify(
          initialForm && {
            ...initialForm,
            status: form.status,
            isArchived: form.isArchived,
            archivedAt: form.archivedAt,
            updatedAt: form.updatedAt,
            revision: form.revision,
          },
        )
    )
      setDiscard(true);
    else onClose();
  };
  const issues = formEditorIssues(form, copy);
  const manage = async (action: "status" | "archive") => {
    if (!onManage || saving || managementBusy || saveLock.current) return;
    saveLock.current = true;
    setManagementBusy(true);
    setSaveError(null);
    try {
      const updated = await onManage(action, form);
      if (updated)
        setEditedForm({
          ...form,
          status: updated.status,
          isArchived: updated.isArchived,
          archivedAt: updated.archivedAt,
          updatedAt: updated.updatedAt,
          revision: updated.revision,
        });
    } catch (error) {
      console.error("Form editor action failed:", error);
      setSaveError(
        action === "status" && form.status === "paused"
          ? copy.publishError
          : copy.saveError,
      );
    } finally {
      saveLock.current = false;
      setManagementBusy(false);
    }
  };
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
    if (step !== "editor" || saveLock.current || media.busy) return;
    setAttempted(true);
    setSaveError(null);
    setFailedImage(null);
    if (duplicating && address.status !== "available") {
      toast.error(
        address.status === "taken"
          ? duplicateCopy.slugTaken
          : duplicateCopy.slugInvalid,
      );
      return;
    }
    if (issues.length) {
      setSelectedIssue(issues[0]);
      toast.error(copy.fixFields, { description: issues[0].message });
      return;
    }
    setSelectedIssue(null);
    saveLock.current = true;
    setSaving(true);

    try {
      const available = duplicating
        ? { available: true }
        : await formsApi.titleAvailability(
            scope,
            form.name.trim(),
            isNew ? undefined : form.id,
          );
      if (!available.available) {
        toast.error(copy.titleTaken);
        setTitleConflict(form.name);
        setSelectedIssue({
          field: "name",
          section: "title",
          message: copy.titleTaken,
        });
        return;
      }
      const draft = {
        ...form,
        name: formDraftName(form),
        updatedAt: new Date().toISOString(),
      };
      if (duplicating && onDuplicate && initialForm) {
        await onDuplicate(initialForm.id, draft, address.slug);
        returnToSource();
      } else await onSave(draft);
      toast.success(
        duplicating
          ? duplicateCopy.duplicated
          : isNew
            ? copy.notifications.created
            : copy.notifications.saved,
      );
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
        toast.error(message);
        setSelectedIssue(formUploadIssues(form, error.image, copy)[0] ?? null);
      } else if (
        duplicating &&
        requestError instanceof ApiRequestError &&
        requestError.status === 409
      ) {
        address.markTaken();
        toast.error(duplicateCopy.slugTaken);
      } else if (
        requestError instanceof ApiRequestError &&
        requestError.code === "FORM_TITLE_TAKEN"
      ) {
        toast.error(copy.titleTaken);
        setTitleConflict(form.name);
        setSelectedIssue({
          field: "name",
          section: "title",
          message: copy.titleTaken,
        });
      } else {
        const message =
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
                      : copy.saveError;
        setSaveError(message);
        toast.error(message);
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
        busy={saving || cropBusy || managementBusy || media.busy}
        title={
          cropRequest
            ? copy.imageCrop.title
            : duplicating
              ? duplicateCopy.title
              : previewOnly
                ? copy.preview
                : step === "layout"
                  ? copy.chooseLayout
                  : copy.editor
        }
        description={
          loading || cropRequest || duplicating
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
              <div
                className="flex w-full flex-wrap items-center justify-between gap-3"
                dir="ltr"
              >
                {!isNew && !duplicating && (onManage || onDuplicate) && (
                  <EditorPageActions
                    labels={copy}
                    paused={form.status === "paused"}
                    archived={!!form.isArchived}
                    disabled={saving || managementBusy || media.busy}
                    onPause={
                      onManage
                        ? () => {
                            void manage("status");
                          }
                        : undefined
                    }
                    onArchive={
                      onManage
                        ? () => {
                            void manage("archive");
                          }
                        : undefined
                    }
                    onDuplicate={
                      canDuplicate && onDuplicate
                        ? () => {
                            void startDuplicate();
                          }
                        : undefined
                    }
                  />
                )}
                <div className="ms-auto">
                  <ModalStepActions
                    primaryHint={
                      issues.length ? (
                        <FormValidationSummary
                          issues={issues}
                          title={copy.fixFields}
                        />
                      ) : undefined
                    }
                    backLabel={duplicating ? copy.cancel : copy.back}
                    onBack={
                      saving || managementBusy || media.busy
                        ? undefined
                        : duplicating
                          ? returnToSource
                          : back
                    }
                    primaryLabel={
                      saving
                        ? duplicating
                          ? duplicateCopy.duplicating
                          : copy.saving
                        : duplicating
                          ? copy.duplicate
                          : isNew
                            ? copy.create
                            : copy.save
                    }
                    primaryDisabled={
                      saving ||
                      media.busy ||
                      managementBusy ||
                      (duplicating && address.status !== "available")
                    }
                    onPrimary={() => {
                      void save();
                    }}
                  />
                </div>
              </div>
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
            <EditorMediaActivityContext.Provider value={media.report}>
              <FormImageCropContext.Provider value={setCropRequest}>
                {cropRequest && (
                  <EditorImageCropWorkspace
                    request={cropRequest}
                    copy={copy.imageCrop}
                    cancelLabel={copy.cancel}
                    onCancel={cancelCrop}
                    onBusyChange={setCropBusy}
                    footerTarget={cropFooter}
                    onApplied={() =>
                      toast.success(copy.notifications.cropApplied)
                    }
                  />
                )}
                <div
                  hidden={!!cropRequest}
                  className={cropRequest ? "hidden" : "contents"}
                >
                  <fieldset
                    disabled={saving || managementBusy || media.busy}
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
                        key={duplicating ? "duplicate" : "source"}
                        form={form}
                        addressEditor={
                          duplicating ? (
                            <DuplicateSlugField
                              check={address}
                              locale={locale}
                              pageType="form"
                            />
                          ) : undefined
                        }
                        titleAvailability={titleAvailability}
                        onChange={(patch) =>
                          (duplicating ? setDuplicateDraft : setEditedForm)(
                            (current) => ({
                              ...(current ?? form),
                              ...patch,
                            }),
                          )
                        }
                        copy={copy}
                      />
                    </FormValidationContext.Provider>
                  </fieldset>
                </div>
              </FormImageCropContext.Provider>
            </EditorMediaActivityContext.Provider>
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
