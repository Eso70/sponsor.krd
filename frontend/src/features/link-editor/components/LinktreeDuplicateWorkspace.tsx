"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  BACKGROUND_PATTERN_CONFIG_KEY,
  LINKTREE_BANNER_KEY,
  readLinktreeBanner,
  type LinktreeListItem,
} from "@linktree/types";
import { apiRequest, isApiRequestError } from "@/lib/api/request";
import { useSubmissionLock } from "@/hooks/useSubmissionLock";
import { DuplicateSlugField } from "@/components/shared/DuplicateSlugField";
import { EditorSection } from "@/components/shared/EditorSection";
import { EditorPreviewLayout } from "@/components/shared/EditorPreviewLayout";
import type { EditorImageCropRequest } from "@/components/shared/EditorImageCropWorkspace";
import type { ColorGradientModalProps } from "@/components/shared/ColorGradientModal";
import { ModalFooterActions } from "@/components/shared/ModalFooterActions";
import { imageCropCopy } from "@/components/shared/image-crop-copy";
import { isLocalRasterImage } from "@/lib/images/local-raster-image";
import { validateUploadFile } from "@/lib/api/inline-request-error";
import { readFormImage, isFormImage } from "@/features/forms/form-media";
import {
  businessMessages,
  type BusinessLocale,
} from "@/features/business/i18n/messages";
import { BACKGROUND_IMAGE_CONFIG_KEY } from "@/lib/templates/background-image";
import { readBackgroundPattern } from "@/lib/templates/background-pattern";
import { savedLinktreePreview } from "../editor-edit-data";
import type { EditLinkData } from "../editor-types";
import { editorDrawerCopy } from "../editor-drawer-copy";
import {
  arabicEditorCopy,
  englishEditorCopy,
  type EditorCopy,
} from "../editor-copy";
import { uploadLinktreeDraftImage } from "../banner-upload";
import { usePageDuplicateSlug } from "@/hooks/usePageDuplicateSlug";
import { BasicInfoStep } from "./BasicInfoStep";
import { LinktreeBannerEditor } from "./LinktreeBannerEditor";
import { LinktreeEditorPreviewPanel } from "./LinktreeEditorPreviewPanel";

const messages = {
  en: {
    image: "Choose a JPEG or PNG image up to 5 MB.",
  },
  ar: {
    image: "اختر صورة JPEG أو PNG حتى 5 ميغابايت.",
  },
  ckb: {
    image: "وێنەی JPEG یان PNG هەڵبژێرە تا ٥ مێگابایت.",
  },
};
type AssetType = "profile-image" | "banner-image" | "background-image";

/** Saved source, editable copy, and live preview remain independent of the original editor draft. */
export function LinktreeDuplicateWorkspace({
  item,
  source,
  locale,
  platformTheme,
  accentColor,
  copy,
  colorCopy,
  footerTarget,
  requestCrop,
  uploadImage,
  onCancel,
  onSuccess,
  onBusyChange,
}: {
  item: LinktreeListItem;
  source: EditLinkData;
  locale: BusinessLocale;
  platformTheme: boolean;
  accentColor?: string;
  copy?: EditorCopy;
  colorCopy?: ColorGradientModalProps["copy"];
  footerTarget: HTMLElement | null;
  requestCrop: (request: EditorImageCropRequest) => void;
  uploadImage: (file: File, assetType: AssetType) => Promise<string | null>;
  onCancel: () => void;
  onSuccess: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const labels = businessMessages[locale].DuplicateLinktree;
  const text = messages[locale];
  const editorCopy =
    copy ??
    (locale === "en"
      ? englishEditorCopy
      : locale === "ar"
        ? arabicEditorCopy
        : undefined);
  const colors =
    colorCopy ??
    (locale === "ckb"
      ? undefined
      : businessMessages[locale].SettingsColorPicker);
  const drawer = editorDrawerCopy(locale);
  const crop = imageCropCopy(locale);
  const original = useMemo(
    () => savedLinktreePreview(source, accentColor, editorCopy),
    [source, accentColor, editorCopy],
  );
  const [draft, setDraft] = useState(original);
  const [open, setOpen] = useState<"basic" | "banner" | null>("basic");
  const [reading, setReading] = useState(false);
  const [bannerBusy, setBannerBusy] = useState(false);
  const [error, setError] = useState<
    "image" | "limit" | "duplicate" | "slug" | null
  >(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploads = useRef(new Map<string, Promise<string>>());
  const { isSubmitting, beginSubmission, resetSubmission } =
    useSubmissionLock();
  const slug = usePageDuplicateSlug(
    platformTheme ? "/api/platform/linktrees" : "/api/linktrees",
    item.id,
  );
  const live = useMemo(
    () => ({ ...draft, slug: slug.slug, accentColor }),
    [draft, slug.slug, accentColor],
  );
  const deferred = useDeferredValue(live);
  const busy = reading || bannerBusy || isSubmitting;
  const depth =
    (item.template_config?._copy_lineage as { depth?: number } | undefined)
      ?.depth ?? 0;
  const maxDepth = !platformTheme && depth >= 3;
  const banner = readLinktreeBanner(
    draft.templateConfig[LINKTREE_BANNER_KEY],
    isFormImage,
  );
  const originalBanner = readLinktreeBanner(
    original.templateConfig[LINKTREE_BANNER_KEY],
    isFormImage,
  );
  useEffect(() => {
    onBusyChange(busy);
    return () => onBusyChange(false);
  }, [busy, onBusyChange]);

  const background = (image: string | null) =>
    setDraft((value) => ({
      ...value,
      backgroundImage: image,
      templateConfig: {
        ...value.templateConfig,
        [BACKGROUND_IMAGE_CONFIG_KEY]: image,
      },
    }));
  const choose = async (
    file: File,
    kind: "logo" | "background",
    cropOutput = false,
  ) => {
    setReading(true);
    setError(null);
    try {
      if (
        validateUploadFile(file, {
          allowedMimeTypes: ["image/jpeg", "image/png"],
          maxBytes: 5 * 1024 * 1024,
        })
      )
        throw new Error("image");
      const image = await readFormImage(file);
      if (kind === "logo") setDraft((value) => ({ ...value, image }));
      else background(image);
    } catch (failure) {
      setError("image");
      if (cropOutput) throw failure;
    } finally {
      setReading(false);
    }
  };
  const cropImage = (kind: "logo" | "background", returnFocus: HTMLElement) => {
    const src = kind === "logo" ? draft.image : draft.backgroundImage;
    if (src && isLocalRasterImage(src))
      requestCrop({
        src,
        returnFocus,
        aspect: "free",
        maxEdge: kind === "logo" ? 720 : 1440,
        allowWebp: false,
        onConfirm: (file) => choose(file, kind, true),
      });
  };
  const persist = (image: string, asset: AssetType): Promise<string> => {
    if (!image.startsWith("data:")) return Promise.resolve(image);
    const key = `${asset}:${image}`;
    if (!uploads.current.has(key))
      uploads.current.set(
        key,
        uploadLinktreeDraftImage(image, (file) =>
          uploadImage(file, asset),
        ).catch((failure) => {
          uploads.current.delete(key);
          throw failure;
        }),
      );
    return uploads.current.get(key)!;
  };
  const submit = async () => {
    if (
      busy ||
      error === "image" ||
      maxDepth ||
      draft.name.trim().length < 2 ||
      slug.status !== "available" ||
      !beginSubmission()
    )
      return;
    setError(null);
    let success = false;
    try {
      const changes: Record<string, unknown> = {
        headline: draft.name.trim(),
        slug: slug.slug,
      };
      if (draft.image !== original.image)
        changes.logo = draft.image
          ? await persist(draft.image, "profile-image")
          : null;
      if (draft.subtitle !== original.subtitle) changes.slogan = draft.subtitle;
      if (draft.subtitleColor !== original.subtitleColor)
        changes.slogan_color = draft.subtitleColor || null;
      if (draft.description !== original.description)
        changes.description = draft.description;
      if (draft.backgroundColor !== original.backgroundColor)
        changes.background_color = draft.backgroundColor;
      if (draft.backgroundImage !== original.backgroundImage)
        changes.background_image = draft.backgroundImage
          ? await persist(draft.backgroundImage, "background-image")
          : null;
      if (draft.templateKey !== original.templateKey)
        changes.template_key = draft.templateKey;
      if (
        draft.templateConfig[BACKGROUND_PATTERN_CONFIG_KEY] !==
        original.templateConfig[BACKGROUND_PATTERN_CONFIG_KEY]
      )
        changes.background_pattern = readBackgroundPattern(
          draft.templateConfig,
        );
      if (
        draft.templateConfig.verification_badge !==
        original.templateConfig.verification_badge
      )
        changes.verification_badge =
          draft.templateConfig.verification_badge === true;
      if (JSON.stringify(banner) !== JSON.stringify(originalBanner))
        changes.banner = {
          ...banner,
          images: await Promise.all(
            banner.images.map((image) => persist(image, "banner-image")),
          ),
        };
      await apiRequest(
        `${platformTheme ? "/api/platform/linktrees" : "/api/linktrees"}/${item.id}/duplicate`,
        { method: "POST", json: changes },
      );
      toast.success(labels.duplicated);
      success = true;
    } catch (failure) {
      const conflict = isApiRequestError(failure, 409);
      const limited = isApiRequestError(failure, 403);
      if (conflict) slug.markTaken();
      const message = conflict
        ? labels.slugTaken
        : limited
          ? labels.limitReached
          : labels.duplicateFailed;
      setError(conflict ? "slug" : limited ? "limit" : "duplicate");
      toast.error(message);
    } finally {
      resetSubmission();
    }
    if (success) onSuccess();
  };
  return (
    <>
      <fieldset disabled={busy} className="contents">
        <EditorPreviewLayout
          direction={locale === "en" ? "ltr" : "rtl"}
          previewLabel={drawer.preview}
          preview={
            <LinktreeEditorPreviewPanel
              draft={deferred}
              locale={locale}
              label={drawer.preview}
              value={draft.backgroundColor}
              onChange={(backgroundColor) =>
                setDraft((value) => ({ ...value, backgroundColor }))
              }
              imagePreview={draft.backgroundImage}
              onImageChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void choose(file, "background");
              }}
              onImageRemove={() => background(null)}
              onImageCrop={
                draft.backgroundImage &&
                isLocalRasterImage(draft.backgroundImage)
                  ? (target) => cropImage("background", target)
                  : undefined
              }
              cropLabel={crop.title}
              colorCopy={colors}
              designControls={{
                locale,
                copy: editorCopy,
                templateKey: draft.templateKey,
                backgroundPattern: readBackgroundPattern(draft.templateConfig),
                onTemplateChange: (templateKey) =>
                  setDraft((value) => ({
                    ...value,
                    templateKey,
                    templateConfig: { ...value.templateConfig, templateKey },
                  })),
                onPatternChange: (pattern) =>
                  setDraft((value) => ({
                    ...value,
                    templateConfig: {
                      ...value.templateConfig,
                      [BACKGROUND_PATTERN_CONFIG_KEY]: pattern,
                    },
                  })),
              }}
            />
          }
        >
          <form
            aria-label={labels.title}
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            className="space-y-3"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {labels.sourcePage} {item.name}
            </p>
            <LinktreeBannerEditor
              banner={banner}
              locale={locale}
              requestCrop={requestCrop}
              onBusyChange={setBannerBusy}
              open={open === "banner"}
              onToggle={() => setOpen(open === "banner" ? null : "banner")}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  templateConfig: {
                    ...current.templateConfig,
                    [LINKTREE_BANNER_KEY]: value,
                  },
                }))
              }
            />
            <EditorSection
              title={editorCopy?.basicStep ?? "زانیارییەکان"}
              open={open === "basic"}
              onToggle={() => setOpen(open === "basic" ? null : "basic")}
            >
              <BasicInfoStep
                idPrefix="duplicate"
                copy={editorCopy}
                colorCopy={colors}
                headline={draft.name}
                slogan={draft.subtitle}
                sloganColor={draft.subtitleColor}
                description={draft.description}
                verificationBadge={
                  draft.templateConfig.verification_badge === true
                }
                onVerificationBadgeChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    templateConfig: {
                      ...current.templateConfig,
                      verification_badge: value,
                    },
                  }))
                }
                logoPreview={draft.image}
                fileInputRef={fileInput}
                errors={{}}
                touched={{}}
                onLogoChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void choose(file, "logo");
                }}
                onRemoveLogo={() => {
                  setDraft((value) => ({ ...value, image: null }));
                  setError(null);
                }}
                onCropLogo={
                  draft.image && isLocalRasterImage(draft.image)
                    ? (target) => cropImage("logo", target)
                    : undefined
                }
                cropLabel={crop.title}
                onHeadlineChange={(name) =>
                  setDraft((value) => ({ ...value, name }))
                }
                onHeadlineBlur={() => undefined}
                onSloganChange={(subtitle) =>
                  setDraft((value) => ({ ...value, subtitle }))
                }
                onSloganColorChange={(subtitleColor) =>
                  setDraft((value) => ({ ...value, subtitleColor }))
                }
                onDescriptionChange={(description) =>
                  setDraft((value) => ({ ...value, description }))
                }
                categoryFields={
                  <DuplicateSlugField
                    check={slug}
                    locale={locale}
                    pageType="linktree"
                    onChange={() => {
                      if (error === "slug") setError(null);
                    }}
                  />
                }
              />
            </EditorSection>
            {(error || maxDepth) && (
              <p role="alert" className="text-xs text-red-500">
                {maxDepth
                  ? labels.depthLimit
                  : error === "image"
                    ? text.image
                    : error === "slug"
                      ? labels.slugTaken
                      : error === "limit"
                        ? labels.limitReached
                        : labels.duplicateFailed}
              </p>
            )}
          </form>
        </EditorPreviewLayout>
      </fieldset>
      {footerTarget &&
        createPortal(
          <ModalFooterActions
            compact
            cancelLabel={labels.cancel}
            submitLabel={labels.duplicate}
            submittingLabel={labels.duplicating}
            isSubmitting={busy}
            submitDisabled={
              error === "image" ||
              maxDepth ||
              draft.name.trim().length < 2 ||
              slug.status !== "available"
            }
            onCancel={onCancel}
            onSubmit={() => void submit()}
          />,
          footerTarget,
        )}
    </>
  );
}
