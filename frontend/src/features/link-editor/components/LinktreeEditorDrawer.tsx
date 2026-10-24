"use client";
import { resolveNewPagePattern } from "@linktree/types/linktree-defaults.cjs";

import {
  memo,
  useDeferredValue,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  startTransition,
  type ReactNode,
} from "react";
import { DuplicateSlugField } from "@/components/shared/DuplicateSlugField";
import { usePageSlugAvailability } from "@/hooks/usePageSlugAvailability";
import { linktreeSlugCopy } from "../linktree-slug-copy";
import { LinktreeQuestionsEditor } from "./LinktreeQuestionsEditor";
import { BasicInfoStep } from "@/features/link-editor/components/BasicInfoStep";
import { LinktreeBannerEditor } from "./LinktreeBannerEditor";
import { LinktreeSeoEditor } from "./LinktreeSeoEditor";
import { LinktreeCategoryFields } from "./LinktreeCategoryFields";
import { linktreeSeoCopy } from "../linktree-seo-copy";
import {
  inspectLinktreeSeo,
  readPlanLinktreeSeo,
  type LinktreeSeo,
} from "@linktree/types/linktree-seo.cjs";
import { readLinktreeBanner, LINKTREE_BANNER_KEY } from "@linktree/types";
import { isFormImage } from "@/features/forms/form-media";
import { uploadLinktreeBanner } from "../banner-upload";
import type { ColorGradientModalProps } from "@/components/shared/ColorGradientModal";
import {
  englishEditorCopy,
  getEditorPlatformName,
  localizeEditorUploadError,
  localizeEditorValidationError,
  type EditorCopy,
} from "@/features/link-editor/editor-copy";
import { PlatformSelectionStep } from "@/features/link-editor/components/PlatformSelectionStep";
import { reorderSocialLinks } from "../link-order";
import { LinksStep } from "@/features/link-editor/components/LinksStep";
import {
  BACKGROUND_COLORS,
  DEFAULT_SUBTITLE,
  DEFAULT_DESCRIPTION,
} from "@/features/link-editor/modal-constants";
import {
  generateUrl,
  extractValueFromUrl,
} from "@/features/link-editor/modal-utils";
import {
  validateLinktreeName,
  validateSingleLink,
  validateWhatsappQuestion,
} from "@/features/link-editor/components/validation";
import {
  TEMPLATE_DEFAULT_ID,
  isTemplateKey,
  normalizeTemplateConfig,
} from "@/lib/templates/config";
import type { WhatsAppQuestion } from "@/components/public/WhatsAppQuestionModal";
import { EditorImageCropWorkspace } from "@/components/shared/EditorImageCropWorkspace";
import { imageCropCopy } from "@/components/shared/image-crop-copy";
import { useEditorImageCrop } from "@/hooks/useEditorImageCrop";
import { isLocalRasterImageWithinLimit } from "@/lib/images/local-raster-image";
import { ManagementDrawer } from "@/components/shared/ManagementDrawer";
import { EditorPreviewLayout } from "@/components/shared/EditorPreviewLayout";
import { LinktreeEditorActions } from "./LinktreeEditorActions";
import {
  LinktreeEditorPageActions,
  type LinktreeEditorManagement,
} from "./LinktreeEditorPageActions";
import { socialLinksFromEditData } from "../editor-edit-data";
import { LinktreeDuplicateWorkspace } from "./LinktreeDuplicateWorkspace";
import { businessMessages } from "@/features/business/i18n/messages";
import { LinktreeEditorPreviewPanel } from "./LinktreeEditorPreviewPanel";
import { LINKTREE_DARK_BACKGROUND } from "./LinktreeAppearanceControls";
import {
  localizeEditorDefaultText,
  localizeEditorDefaultLinkName,
  questionDefaultKeys,
} from "../editor-default-text";
import { editorDrawerCopy } from "../editor-drawer-copy";
import { LinktreeEditorLoadingContent } from "./LinktreeEditorLoadingContent";
import type { LinktreeEditorPreviewDraft } from "../editor-preview";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { EditorSection } from "@/components/shared/EditorSection";
import { debounce } from "@/lib/utils/debounce";
import { useSubmissionLock } from "@/hooks/useSubmissionLock";
import type { SocialLink } from "@/features/link-editor/types";
import {
  groupSocialLinksByPlatform,
  normalizeSelectedSocialLinks,
} from "@/features/link-editor/link-payload";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { InlineRequestError } from "@/components/shared/InlineRequestError";
import {
  createUploadFailureError,
  inlineRequestErrorFromResponse,
  type InlineRequestErrorData,
  validateUploadFile,
} from "@/lib/api/inline-request-error";
import { enqueueImageUpload } from "@/lib/api/enqueue-image-upload";
import {
  BACKGROUND_IMAGE_CONFIG_KEY,
  isBackgroundImageUrl,
  readBackgroundImage,
} from "@/lib/templates/background-image";
import { readBackgroundPattern } from "@/lib/templates/background-pattern";
import {
  BACKGROUND_PATTERN_CONFIG_KEY,
  type BackgroundPatternStyle,
} from "@linktree/types";
import type {
  EditLinkData,
  LinktreeEditorSubmitData,
} from "@/features/link-editor/editor-types";
export type {
  EditLinkData,
  LinktreeEditorSubmitData,
} from "@/features/link-editor/editor-types";

export interface LinktreeEditorDrawerProps {
  advancedSeoAllowed?: boolean;
  management?: LinktreeEditorManagement;
  headerControls?: ReactNode;
  locale?: BusinessLocale;
  isOpen: boolean;
  onClose: () => void;
  isDefault?: boolean;
  onSubmit: (data: LinktreeEditorSubmitData, editId?: string) => void;
  editData?: EditLinkData | null;
  isLoadingEditData?: boolean;
  /** Business defaults set by the platform administrator. */
  businessDefaults?: {
    default_template?: string | null;
    default_background_color?: string | null;
    default_background_pattern?: string | null;
    default_whatsapp_enabled?: boolean;
    default_avatar?: string | null;
  } | null;
  businessIdentity?: {
    name?: string | null;
    phone?: string | null;
  } | null;
  apiEndpoints?: {
    upload: string;
    checkSlug: string;
    checkName: string;
  };
  /** Uses the platform-admin gradient for modal chrome while preserving the page preview palette. */
  platformTheme?: boolean;
  copy?: EditorCopy;
  colorCopy?: ColorGradientModalProps["copy"];
}

const DEFAULT_API_ENDPOINTS = {
  upload: "/api/linktrees/upload",
  checkSlug: "/api/linktrees/check-slug",
  checkName: "/api/linktrees/check-name",
} as const;

/**
 * What a new page's canvas starts as when the business has set no page default.
 *
 * White, and never the tenant colour — `website_color` themes the dashboard and
 * the public shell, and presetting it here made every new page open on the
 * brand colour. Mirrors DEFAULT_LINKTREE_BACKGROUND_COLOR in
 * backend/src/common/linktree-defaults.ts.
 */
const DEFAULT_BACKGROUND_COLOR = "#ffffff";

function extractSolidHex(color: string | undefined | null): string {
  if (!color) return "";
  const trimmed = color.trim();
  if (/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return trimmed;
  if (trimmed.startsWith("gradient:")) {
    const parts = trimmed.split(":");
    if (
      parts.length >= 4 &&
      /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(parts[2])
    ) {
      return parts[2];
    }
  }
  return "";
}


function resolveDefaultBackgroundColor(value?: string | null): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return DEFAULT_BACKGROUND_COLOR;
  }

  const preset = BACKGROUND_COLORS.find((color) => {
    return (
      color.id === trimmed ||
      color.value.toLowerCase() === trimmed.toLowerCase()
    );
  });

  return preset?.value ?? trimmed;
}

function resolveDefaultTemplateKey(value?: string | null): string {
  return value && isTemplateKey(value) ? value : TEMPLATE_DEFAULT_ID;
}

function normalizeBusinessPhone(value?: string | null): {
  value: string;
  countryCode: string;
} {
  const digits = value?.replace(/\D/g, "") || "";
  if (!digits) return { value: "", countryCode: "964" };
  return extractValueFromUrl("phone", `tel:+${digits}`);
}

export const LinktreeEditorDrawer = memo(function LinktreeEditorDrawer({
  isOpen,
  locale = "ckb",
  onClose,
  onSubmit,
  editData,
  isLoadingEditData = false,
  businessDefaults,
  businessIdentity,
  isDefault = false,
  apiEndpoints = DEFAULT_API_ENDPOINTS,
  platformTheme = false,
  advancedSeoAllowed = platformTheme,
  copy,
  colorCopy,
  headerControls,
  management,
}: LinktreeEditorDrawerProps) {
  const [managementBusy, setManagementBusy] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateFooter, setDuplicateFooter] = useState<HTMLDivElement | null>(
    null,
  );
  const defaultTemplateKey = resolveDefaultTemplateKey(
    businessDefaults?.default_template,
  );
  const { color: businessTheme } = useTheme();
  const {
    cropRequest,
    setCropRequest,
    cropBusy,
    setCropBusy,
    cropFooter,
    setCropFooter,
    cancelCrop,
  } = useEditorImageCrop();
  const cropCopy = imageCropCopy(locale);
  const [openSection, setOpenSection] = useState<
    "banner" | "basic" | "select" | "links" | "questions" | "seo" | null
  >("basic");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    businessDefaults?.default_avatar || null,
  );
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const slugCheck = usePageSlugAvailability(apiEndpoints.checkSlug, slug, {
    enabled: isOpen && !isLoadingEditData,
    excludeId: editData?.linktree.id,
    initialSlug: editData?.linktree.seo_name ?? "",
  });
  const slugValid = (!editData?.linktree.seo_name && !slug) || slugCheck.status === "available";
  const slugCopy = linktreeSlugCopy[locale];
  // Explicit edits keep their values even when they happen to match a default.
  const authoredText = useRef(new Set<string>());
  const previousCopy = useRef(copy);
  const [subtitle, setSubtitle] = useState(DEFAULT_SUBTITLE);
  const [subtitleColor, setSubtitleColor] = useState("");
  const [description, setDescription] = useState(
    copy?.defaultDescription ?? DEFAULT_DESCRIPTION,
  );
  const [backgroundColor, setBackgroundColor] = useState<string>(LINKTREE_DARK_BACKGROUND);
  // A background image replaces the background colour on the public page. Like
  // the profile image, the file is held until submit and uploaded once.
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<
    string | null
  >(null);
  const [templateKey, setTemplateKey] = useState<string>(defaultTemplateKey);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const selectedPlatforms = useMemo(
    () =>
      [...socialLinks]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((link) => link.id),
    [socialLinks],
  );
  const { isSubmitting, beginSubmission, resetSubmission } =
    useSubmissionLock();
  const [status, setStatus] = useState<"active" | "inactive">("active");
  useEffect(() => {
    if (management)
      setStatus(management.item.status === "inactive" ? "inactive" : "active");
  }, [management]);
  const [templateConfig, setTemplateConfig] = useState<Record<string, unknown>>(
    () =>
      normalizeTemplateConfig(
        resolveDefaultTemplateKey(businessDefaults?.default_template),
        null,
      ),
  );

  // WhatsApp modal questions state
  const [whatsappModalEnabled, setWhatsappModalEnabled] = useState(
    businessDefaults?.default_whatsapp_enabled ?? false,
  );
  const [whatsappModalTitle, setWhatsappModalTitle] = useState(
    copy?.whatsappTitle ?? "پەیوەندی کردن",
  );
  const [whatsappModalSubtitle, setWhatsappModalSubtitle] = useState(
    copy?.whatsappSubtitle ?? "پرسیارێک هەڵبژێرە",
  );
  const [whatsappQuestions, setWhatsappQuestions] = useState<
    WhatsAppQuestion[]
  >([
    {
      id: "order",
      text: copy?.order ?? "داواکردن",
      message: copy?.orderMessage ?? "سڵاو بەڕێز دەمەوێت داوا بکەم.",
    },
    {
      id: "price",
      text: copy?.price ?? "زانینی نرخ",
      message: copy?.priceMessage ?? "سڵاو بەڕێز، نرخی چەندە ؟",
    },
    {
      id: "other",
      text: copy?.other ?? "پرسیارێکی تر",
      message: copy?.otherMessage ?? "سڵاو",
    },
  ]);

  // Validation errors state
  const [errors, setErrors] = useState<{
    name?: string;
    backgroundColor?: string;
    templateKey?: string;
    platforms?: string;
    links?: string;
    image?: string;
    questions?: string;
    subtitleColor?: string;
  }>({});

  // Per-link validation errors: { platformId_linkIndex: errorMessage }
  const [linkErrors, setLinkErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<{
    name?: boolean;
    backgroundColor?: boolean;
    templateKey?: boolean;
    platforms?: boolean;
    links?: boolean;
    subtitleColor?: boolean;
  }>({});

  const [backgroundPattern, setBackgroundPattern] =
    useState<BackgroundPatternStyle>(() => resolveNewPagePattern(businessDefaults?.default_background_pattern));
  /**
   * A duplicate display name is a warning, never an error: `linktrees.name`
   * has no unique constraint and two pages may legitimately share one. It is
   * surfaced so the owner does not end up with two cards they cannot tell
   * apart in the pages list.
   */
  const [nameWarning, setNameWarning] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<InlineRequestErrorData | null>(
    null,
  );
  const [submitError, setSubmitError] = useState<InlineRequestErrorData | null>(
    null,
  );
  const [checkingName, setCheckingName] = useState(false);
  const [questionErrors, setQuestionErrors] = useState<
    Record<string, { text?: string; message?: string; videoUrl?: string }>
  >({});
  const [seoErrors, setSeoErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!editData;
  const initializedLinktreeIdRef = useRef<string | null>(null);

  // Generate unique ID for links - memoized to prevent dependency issues
  const generateLinkId = useCallback((platformId: string): string => {
    return `${platformId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  // Real-time validation, delegated to the shared rules so the modal, the DTO
  // and the table CHECK constraints cannot disagree.
  const validateName = useCallback(
    (value: string) =>
      localizeEditorValidationError(validateLinktreeName(value), copy),
    [copy],
  );

  const validateLink = useCallback(
    (platform: string, value: string, countryCode?: string) =>
      localizeEditorValidationError(
        validateSingleLink(platform, value, countryCode),
        copy,
      ),
    [copy],
  );

  /**
   * Half-filled question rows.
   *
   * The server drops a question that has a label but no message, so without
   * this the row the owner typed disappears on save with nothing said.
   */
  const validateQuestions = useCallback(
    (questions: WhatsAppQuestion[], enabled: boolean): string | undefined => {
      // The rows are only rendered while the modal is switched on. Blocking on
      // a row nobody can see would be an error with nowhere to point.
      if (!enabled) {
        setQuestionErrors({});
        return undefined;
      }
      const next: Record<
        string,
        { text?: string; message?: string; videoUrl?: string }
      > = {};
      for (const question of questions) {
        const error = validateWhatsappQuestion(question);
        if (error) next[question.id] = error;
      }
      setQuestionErrors(next);
      return Object.keys(next).length > 0
        ? (copy?.incompleteQuestions ?? "تکایە پرسیارە ناتەواوەکان تەواو بکە")
        : undefined;
    },
    [copy],
  );

  const validateBackgroundColor = useCallback(
    (value: string): string | undefined => {
      const selectedBgColor =
        BACKGROUND_COLORS.find((c) => c.id === value)?.value || value;
      if (!selectedBgColor) {
        return copy?.backgroundRequired ?? "تکایە ڕەنگی باکگڕاوند هەڵبژێرە";
      }
      return undefined;
    },
    [copy],
  );

  const validateTemplateKey = useCallback(
    (value: string): string | undefined => {
      if (!value || !isTemplateKey(value)) {
        return copy?.templateRequired ?? "تکایە شێوازی پەڕە هەڵبژێرە";
      }
      return undefined;
    },
    [copy],
  );

  const validatePlatforms = useCallback(
    (platforms: string[]): string | undefined => {
      if (!platforms || platforms.length === 0) {
        return copy?.platformRequired ?? "لانیکەم یەک پلاتفۆڕمەکان هەڵبژێرە";
      }
      return undefined;
    },
    [copy],
  );

  const validateLinks = useCallback(
    (links: SocialLink[], selected: string[]): string | undefined => {
      if (!selected || selected.length === 0) {
        return copy?.platformRequired ?? "لانیکەم یەک پلاتفۆڕمەکان هەڵبژێرە";
      }
      let hasError = false;
      const newLinkErrors: Record<string, string> = {};

      // Validate each link
      for (const linkId of selected) {
        const link = links.find((l) => l.id === linkId);
        if (!link) continue;

        const linkValue = link.value?.trim() || "";
        const linkUrl = link.url?.trim() || "";

        // Must have either value or URL
        if (!linkValue && !linkUrl) {
          newLinkErrors[linkId] =
            copy?.linkValueRequired ?? "تکایە بەهای لینکەکە بنووسە";
          hasError = true;
          continue;
        }

        const error = validateLink(link.platform, linkValue, link.countryCode);
        if (error) {
          newLinkErrors[linkId] = error;
          hasError = true;
        }
      }

      if (hasError) {
        setLinkErrors(newLinkErrors);
        return copy?.fixLinks ?? "تکایە هەڵەی لینکەکان چاک بکەرەوە";
      } else {
        setLinkErrors({});
      }

      return undefined;
    },
    [copy, validateLink],
  );

  // Question rows clear their own error as soon as the missing half is typed.
  useEffect(() => {
    setQuestionErrors((previous) => {
      if (Object.keys(previous).length === 0) return previous;
      const next: Record<
        string,
        { text?: string; message?: string; videoUrl?: string }
      > = {};
      for (const question of whatsappQuestions) {
        if (!previous[question.id]) continue;
        const error = validateWhatsappQuestion(question);
        if (error) next[question.id] = error;
      }
      return next;
    });
  }, [whatsappQuestions]);

  // Debounced name validation
  const debouncedNameValidation = useMemo(
    () =>
      debounce((value: unknown) => {
        if (touched.name && typeof value === "string") {
          setErrors((prev) => ({ ...prev, name: validateName(value) }));
        }
      }, 200),
    [touched.name, validateName],
  );

  // Update validation on field changes - optimized
  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      debouncedNameValidation(value);
    },
    [debouncedNameValidation],
  );

  const handleNameBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, name: true }));
    setErrors((prev) => ({ ...prev, name: validateName(name) }));
  }, [name, validateName]);

  const handleBackgroundColorChange = useCallback(
    (value: string) => {
      setBackgroundColor(value);
      if (touched.backgroundColor) {
        setErrors((prev) => ({
          ...prev,
          backgroundColor: validateBackgroundColor(value),
        }));
      }
    },
    [touched.backgroundColor, validateBackgroundColor],
  );

  const handleBackgroundColorBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, backgroundColor: true }));
    setErrors((prev) => ({
      ...prev,
      backgroundColor: validateBackgroundColor(backgroundColor),
    }));
  }, [backgroundColor, validateBackgroundColor]);

  const handleTemplateKeyChange = useCallback(
    (value: string) => {
      setTemplateKey(value);
      setTemplateConfig((prev) => normalizeTemplateConfig(value, prev));
      setTouched((prev) => ({ ...prev, templateKey: true }));
      setErrors((prev) => ({
        ...prev,
        templateKey: validateTemplateKey(value),
      }));
    },
    [validateTemplateKey],
  );

  // Handle image upload - memoized for performance
  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const validationError = validateUploadFile(file, {
          allowedMimeTypes: ["image/png", "image/jpeg"],
          maxBytes: 10 * 1024 * 1024,
        });
        if (validationError) {
          setUploadError(validationError);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }
        setUploadError(null);

        // Clear any previous image errors
        setErrors((prev) => ({ ...prev, image: undefined }));

        setProfileImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [],
  );

  const handleBackgroundImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset the input so re-picking the same file still fires a change.
      e.target.value = "";
      if (!file) {
        return;
      }

      const validationError = validateUploadFile(file, {
        allowedMimeTypes: ["image/png", "image/jpeg"],
        maxBytes: 10 * 1024 * 1024,
      });
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      setUploadError(null);
      setBackgroundImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  const handleRemoveBackgroundImage = useCallback(() => {
    setBackgroundImage(null);
    setBackgroundImagePreview(null);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setProfileImage(null);
    // Reset to business's default avatar instead of null
    setProfileImagePreview(businessDefaults?.default_avatar || null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [businessDefaults]);

  // Upload image to local file system storage
  const uploadImage = async (
    file: File,
    assetType:
      "profile-image" | "background-image" | "banner-image" | "social-image",
  ): Promise<string | null> => {
    return enqueueImageUpload(async () => {
      setUploadError(null);
      try {
        const formData = new FormData();
        const linktreeKey = (editData?.linktree.id || name || "draft")
          .trim()
          .toLowerCase();
        formData.append("file", file);
        formData.append("linktreeKey", linktreeKey);
        formData.append("assetType", assetType);

        const response = await fetch(apiEndpoints.upload, {
          method: "POST",
          cache: "no-store", // Always fetch fresh data
          credentials: "include", // Include cookies for authentication
          body: formData,
        });

        if (!response.ok) {
          setUploadError(inlineRequestErrorFromResponse(response));
          return null;
        }

        const result = await response.json();
        return result.url || null;
      } catch {
        setUploadError(createUploadFailureError());
        return null;
      }
    });
  };

  // Removed processedLinks memo - now computed inline in useEffect to avoid dependency issues

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDuplicating(false);
      initializedLinktreeIdRef.current = null;
      setCropRequest(null);
      setUploadError(null);
      resetSubmission();
      setLinkErrors({});
      setBackgroundImage(null);
      setBackgroundImagePreview(null);
      const defaultTemplate = resolveDefaultTemplateKey(
        businessDefaults?.default_template,
      );
      setBackgroundColor(resolveDefaultBackgroundColor(businessDefaults?.default_background_color || LINKTREE_DARK_BACKGROUND));
      setBackgroundPattern(resolveNewPagePattern(businessDefaults?.default_background_pattern));
      setTemplateKey(defaultTemplate);
      setTemplateConfig(normalizeTemplateConfig(defaultTemplate, null));
    }
  }, [
    isOpen,
    businessDefaults?.default_background_color,
    businessDefaults?.default_background_pattern,
    businessDefaults?.default_template,
    resetSubmission,
    setCropRequest,
  ]);

  // Initialize form data when editing (optimized - only runs when editData changes)
  useEffect(() => {
    if (!isOpen || isLoadingEditData) {
      return;
    }

    // Initialize only once when editData is first loaded or when switching between edit/create modes
    const shouldInitialize = editData
      ? initializedLinktreeIdRef.current !== editData.linktree.id
      : initializedLinktreeIdRef.current !== "create";

    if (!shouldInitialize) {
      return;
    }

    authoredText.current.clear();
    setSeoErrors({});
    setCropRequest(null);
    if (editData) {
      // ============================================
      // VALIDATE AND SANITIZE EDIT DATA
      // ============================================
      const linktree = editData.linktree;
      setSlug(linktree.seo_name ?? "");

      // Validate linktree ID
      if (!linktree.id || typeof linktree.id !== "string") {
        console.error("Invalid linktree ID in edit data");
        console.error("Invalid linktree data");
        return;
      }

      // Sanitize and set name (max 100 chars)
      const sanitizedName = (linktree.headline ?? linktree.name ?? "").trim();
      if (!sanitizedName) {
        setName(copy?.untitledPage ?? "Untitled Linktree");
      } else {
        setName(sanitizedName);
      }

      // Sanitize and set subtitle (max 200 chars)
      const sanitizedSubtitle = (
        linktree.slogan ??
        linktree.subtitle ??
        ""
      ).trim();
      setSubtitle(sanitizedSubtitle || DEFAULT_SUBTITLE);
      setSubtitleColor(
        extractSolidHex(linktree.slogan_color ?? linktree.subtitle_color),
      );
      setSubmitError(null);

      // Sanitize and set description (max 500 chars)
      const sanitizedDescription = (linktree.description || "").trim();
      setDescription(
        sanitizedDescription || copy?.defaultDescription || DEFAULT_DESCRIPTION,
      );

      // Validate and set background color
      const bgColor = linktree.background_color || "#eab308";
      setBackgroundColor(resolveDefaultBackgroundColor(bgColor));

      const normalizedConfig = normalizeTemplateConfig(
        undefined,
        (linktree.template_config as Record<string, unknown> | null) ?? null,
      );
      const configTemplateKey = normalizedConfig["templateKey"];
      const sanitizedTemplate =
        typeof configTemplateKey === "string" &&
        isTemplateKey(configTemplateKey)
          ? configTemplateKey
          : TEMPLATE_DEFAULT_ID;
      setTemplateKey(sanitizedTemplate);
      setTemplateConfig(normalizedConfig);

      // Only a stored upload path survives hydration; anything else is treated
      // as no image, matching what the public page will agree to paint.
      setBackgroundImage(null);
      setBackgroundImagePreview(readBackgroundImage(normalizedConfig));
      setBackgroundPattern(readBackgroundPattern(normalizedConfig));

      // Load WhatsApp modal config from template_config
      const whatsappModal = (
        linktree.template_config as Record<string, unknown> | null
      )?.whatsapp_modal;
      if (
        whatsappModal &&
        typeof whatsappModal === "object" &&
        !Array.isArray(whatsappModal)
      ) {
        const modal = whatsappModal as Record<string, unknown>;
        // Load enabled flag, default to false if not found
        const enabled =
          typeof modal.enabled === "boolean" ? modal.enabled : false;
        setWhatsappModalEnabled(enabled);
        setWhatsappModalTitle(
          localizeEditorDefaultText(
            typeof modal.title === "string" && modal.title.trim()
              ? modal.title
              : englishEditorCopy.whatsappTitle,
            "whatsappTitle",
            copy,
          ),
        );
        setWhatsappModalSubtitle(
          localizeEditorDefaultText(
            typeof modal.subtitle === "string" && modal.subtitle.trim()
              ? modal.subtitle
              : englishEditorCopy.whatsappSubtitle,
            "whatsappSubtitle",
            copy,
          ),
        );
        if (Array.isArray(modal.questions)) {
          const questions = modal.questions
            .filter((q): q is WhatsAppQuestion => {
              if (!q || typeof q !== "object") return false;
              const obj = q as unknown as Record<string, unknown>;
              return (
                typeof obj.id === "string" &&
                typeof obj.text === "string" &&
                typeof obj.message === "string"
              );
            })
            .map((q) => {
              const obj = q as unknown as Record<string, unknown>;
              return {
                id: obj.id as string,
                text: obj.text as string,
                message: obj.message as string,
                videoUrl:
                  typeof obj.videoUrl === "string" ? obj.videoUrl : undefined,
              };
            });
          if (questions.length > 0) setWhatsappQuestions(questions);
        }
      }

      // Set status
      setStatus(linktree.status === "inactive" ? "inactive" : "active");

      // Validate and set image
      const storedLogo = linktree.logo ?? linktree.image;
      if (storedLogo && typeof storedLogo === "string") {
        const imageUrl = storedLogo.trim();
        // Accept valid URLs (absolute or relative) and data URLs
        if (
          imageUrl.startsWith("http://") ||
          imageUrl.startsWith("https://") ||
          imageUrl.startsWith("/") ||
          imageUrl.startsWith("data:image/")
        ) {
          setProfileImagePreview(imageUrl);
        } else {
          // Silently handle invalid URLs - don't log warnings for edge cases
          setProfileImagePreview(null);
        }
      } else {
        setProfileImagePreview(null);
      }

      // Use memoized processed links (already validated in useMemo)
      // Access processedLinks directly from the memoized value
      const currentProcessedLinks = socialLinksFromEditData(
        editData.links ?? [],
        copy,
      );

      if (currentProcessedLinks.length > 0) {
        setSocialLinks(currentProcessedLinks);
      } else {
        setSocialLinks([]);
      }

      // Only reset to first step when first opening edit mode, not on subsequent renders
      if (initializedLinktreeIdRef.current === null) {
        setOpenSection("basic");
        resetSubmission();
      }

      initializedLinktreeIdRef.current = editData.linktree.id;
    } else if (!editData) {
      // Reset form for create mode - use business defaults if available
      const defaultTemplate = resolveDefaultTemplateKey(
        businessDefaults?.default_template,
      );
      const defaultBusinessName = businessIdentity?.name?.trim() || "";
      const defaultBusinessPhone = businessIdentity?.phone?.trim() || "";
      setName(isDefault ? defaultBusinessName : "");
      setSlug("");
      setSubtitle(DEFAULT_SUBTITLE);
      setSubtitleColor("");
      setDescription(copy?.defaultDescription ?? DEFAULT_DESCRIPTION);
      setBackgroundColor(resolveDefaultBackgroundColor(businessDefaults?.default_background_color || LINKTREE_DARK_BACKGROUND));
      setTemplateKey(defaultTemplate);
      setTemplateConfig(normalizeTemplateConfig(defaultTemplate, null));
      setProfileImage(null);
      setProfileImagePreview(businessDefaults?.default_avatar || null);
      setBackgroundImage(null);
      setBackgroundImagePreview(null);
      setBackgroundPattern(resolveNewPagePattern(businessDefaults?.default_background_pattern));
      if (isDefault) {
        const normalizedPhone = normalizeBusinessPhone(defaultBusinessPhone);
        setSocialLinks(
          ["whatsapp", "phone"].map((platform, order) => ({
            id: generateLinkId(platform),
            platform,
            url: generateUrl(
              platform,
              normalizedPhone.value,
              normalizedPhone.countryCode,
            ),
            value: normalizedPhone.value,
            countryCode: normalizedPhone.countryCode,
            displayName: getEditorPlatformName(platform, copy),
            enabled: true,
            order,
          })),
        );
      } else {
        setSocialLinks([]);
      }
      setStatus("active");
      setWhatsappModalEnabled(
        businessDefaults?.default_whatsapp_enabled ?? false,
      );
      setWhatsappModalTitle(copy?.whatsappTitle ?? "پەیوەندی کردن");
      setWhatsappModalSubtitle(copy?.whatsappSubtitle ?? "پرسیارێک هەڵبژێرە");
      setWhatsappQuestions([
        {
          id: "order",
          text: copy?.order ?? "داواکردن",
          message: copy?.orderMessage ?? "سڵاو بەڕێز دەمەوێت داوا بکەم.",
        },
        {
          id: "price",
          text: copy?.price ?? "زانینی نرخ",
          message: copy?.priceMessage ?? "سڵاو بەڕێز، نرخی چەندە ؟",
        },
        {
          id: "other",
          text: copy?.other ?? "پرسیارێکی تر",
          message: copy?.otherMessage ?? "سڵاو",
        },
      ]);
      setOpenSection("basic");
      resetSubmission();
      initializedLinktreeIdRef.current = "create";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editData?.linktree.id, isOpen, isLoadingEditData]);

  useEffect(() => {
    const changed = previousCopy.current !== copy;
    previousCopy.current = copy;
    if (!isOpen || !changed) return;
    startTransition(() => {
      if (!authoredText.current.has("description")) {
        setDescription((value) =>
          localizeEditorDefaultText(value, "defaultDescription", copy),
        );
      }
      if (!authoredText.current.has("whatsappTitle")) {
        setWhatsappModalTitle((value) =>
          localizeEditorDefaultText(value, "whatsappTitle", copy),
        );
      }
      if (!authoredText.current.has("whatsappSubtitle")) {
        setWhatsappModalSubtitle((value) =>
          localizeEditorDefaultText(value, "whatsappSubtitle", copy),
        );
      }
      setSocialLinks((links) =>
        links.map((link) =>
          authoredText.current.has(`link:${link.id}`)
            ? link
            : {
                ...link,
                displayName: localizeEditorDefaultLinkName(
                  link.displayName,
                  link.platform,
                  copy,
                ),
              },
        ),
      );
      setWhatsappQuestions((questions) =>
        questions.map((question) => {
          const keys = questionDefaultKeys(question.id);
          if (!keys) return question;
          return {
            ...question,
            text: authoredText.current.has(`question:${question.id}:text`)
              ? question.text
              : localizeEditorDefaultText(question.text, keys.text, copy),
            message: authoredText.current.has(`question:${question.id}:message`)
              ? question.message
              : localizeEditorDefaultText(question.message, keys.message, copy),
          };
        }),
      );
    });
  }, [copy, isOpen]);

  const updateWhatsappQuestions = useCallback(
    (questions: WhatsAppQuestion[]) => {
      for (const question of questions) {
        const previous = whatsappQuestions.find(
          (item) => item.id === question.id,
        );
        for (const field of ["text", "message"] as const) {
          if (!previous || previous[field] !== question[field])
            authoredText.current.add(`question:${question.id}:${field}`);
        }
      }
      setWhatsappQuestions(questions);
    },
    [whatsappQuestions],
  );

  /**
   * Debounced duplicate-name check.
   *
   * Advisory only. It never reaches `errors`, so it cannot block a save the
   * server would have accepted.
   */
  useEffect(() => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNameWarning(null);
      setCheckingName(false);
      return;
    }
    let cancelled = false;
    setCheckingName(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ name: trimmed });
        if (isEditMode && editData?.linktree?.id)
          params.set("excludeId", editData.linktree.id);
        const res = await fetch(`${apiEndpoints.checkName}?${params}`, {
          credentials: "include",
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setNameWarning(
            json.data
              ? null
              : (copy?.nameTaken ?? "پەڕەیەکی تر بە هەمان ناو هەیە"),
          );
        }
      } catch {
        // network error — the name is not required to be unique anyway
      } finally {
        if (!cancelled) setCheckingName(false);
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, isEditMode, editData?.linktree?.id, apiEndpoints.checkName, copy]);

  // Note: platformMap removed - using functional state updates instead for better reliability

  useEffect(() => {
    if (!touched.platforms) return;
    setErrors((previous) => ({
      ...previous,
      platforms: validatePlatforms(selectedPlatforms),
    }));
  }, [selectedPlatforms, touched.platforms, validatePlatforms]);

  // Toggle a platform by updating the canonical link list. Selected IDs are
  // derived from this list so the selection and links steps cannot drift.
  const togglePlatform = useCallback(
    (platformId: string) => {
      startTransition(() => {
        setSocialLinks((prevLinks) => {
          const existingLinks = prevLinks.filter(
            (l) => l.platform === platformId,
          );
          const isSelected = existingLinks.length > 0;

          if (isSelected) {
            return prevLinks
              .filter((l) => l.platform !== platformId)
              .map((link, index) => ({ ...link, order: index }));
          }

          const newLink: SocialLink = {
            id: generateLinkId(platformId),
            platform: platformId,
            url: "",
            value: "",
            displayName: getEditorPlatformName(platformId, copy),
            enabled: true,
            order: prevLinks.length,
          };
          const nonGpsLinks = prevLinks.filter(
            (link) => link.platform !== "gps",
          );
          const gpsLinks = prevLinks.filter((link) => link.platform === "gps");
          const nextLinks =
            platformId === "gps"
              ? [...nonGpsLinks, newLink]
              : [...nonGpsLinks, newLink, ...gpsLinks];

          return nextLinks.map((link, index) => ({ ...link, order: index }));
        });
      });
    },
    [generateLinkId, copy],
  );

  // Add another instance of a platform - memoized for performance
  const addPlatformInstance = useCallback(
    (platformId: string) => {
      if (platformId === "gps") {
        return;
      }
      const newLinkId = generateLinkId(platformId);
      setSocialLinks((prev) => {
        const newLink: SocialLink = {
          id: newLinkId,
          platform: platformId,
          url: "",
          value: "",
          displayName: getEditorPlatformName(platformId, copy),
          enabled: true,
          order: prev.length,
        };
        const nonGpsLinks = prev.filter((link) => link.platform !== "gps");
        const gpsLinks = prev.filter((link) => link.platform === "gps");
        const nextLinks = [...nonGpsLinks, newLink, ...gpsLinks];
        return nextLinks.map((link, index) => ({ ...link, order: index }));
      });
    },
    [generateLinkId, copy],
  );

  // Remove a link instance - memoized for performance
  const removeLinkInstance = useCallback((linkId: string) => {
    setSocialLinks((prev) =>
      prev
        .filter((link) => link.id !== linkId)
        .map((link, index) => ({ ...link, order: index })),
    );
    setLinkErrors((previous) => {
      const next = { ...previous };
      delete next[linkId];
      return next;
    });
  }, []);

  // Update social link
  const updateSocialLink = useCallback(
    (id: string, value: string) => {
      setSocialLinks((prev) => {
        const existing = prev.find((link) => link.id === id);
        const platformId = existing
          ? existing.platform
          : id.includes("-")
            ? id.split("-")[0]
            : id;
        const isPhoneBased =
          platformId === "whatsapp" ||
          platformId === "phone" ||
          platformId === "viber";
        const code = isPhoneBased ? existing?.countryCode || "964" : "";
        const url = generateUrl(
          platformId,
          value || "",
          isPhoneBased ? code : undefined,
        );

        // If this link already has an error, re-validate it in real-time
        if (linkErrors[id]) {
          const error = validateLink(platformId, value || "", code);
          setLinkErrors((prevErrors) => {
            if (error) {
              return { ...prevErrors, [id]: error };
            } else {
              const nextErrors = { ...prevErrors };
              delete nextErrors[id];
              return nextErrors;
            }
          });
        }

        if (!existing) {
          // Create new link if it doesn't exist
          const newLink: SocialLink = {
            id,
            platform: platformId,
            url,
            value: value || "",
            countryCode: code,
            displayName: getEditorPlatformName(platformId, copy),
            enabled: true,
            order: prev.length,
          };
          return [...prev, newLink];
        }

        // Update existing link
        const updatedLink: SocialLink = {
          ...existing,
          url,
          value: value || "",
          countryCode: code,
        };

        // Return new array with updated link
        return prev.map((link) => (link.id === id ? updatedLink : link));
      });
    },
    [linkErrors, validateLink, copy],
  );

  // Update display name for a link
  const updateDisplayName = useCallback((id: string, displayName: string) => {
    authoredText.current.add(`link:${id}`);
    setSocialLinks((prev) => {
      const existing = prev.find((link) => link.id === id);
      if (!existing) {
        return prev; // Link doesn't exist
      }

      // Create updated link object
      const updatedLink: SocialLink = {
        ...existing,
        displayName: displayName || undefined,
      };

      // Return new array with updated link
      return prev.map((link) => (link.id === id ? updatedLink : link));
    });
  }, []);

  // Update custom color for a link
  const updateCustomColor = useCallback((id: string, customColor: string) => {
    setSocialLinks((prev) => {
      const existing = prev.find((link) => link.id === id);
      if (!existing) {
        return prev;
      }
      return prev.map((link) =>
        link.id === id ? { ...existing, customColor } : link,
      );
    });
  }, []);

  // Update custom icon for a link
  const updateCustomIcon = useCallback((id: string, customIcon: string) => {
    setSocialLinks((prev) => {
      const existing = prev.find((link) => link.id === id);
      if (!existing) {
        return prev;
      }
      return prev.map((link) =>
        link.id === id ? { ...existing, customIcon } : link,
      );
    });
  }, []);

  const updateCountryCode = useCallback(
    (id: string, countryCode: string) => {
      if (!countryCode || !/^\d{1,3}$/.test(countryCode.trim())) {
        return;
      }

      const trimmedCode = countryCode.trim();

      // Update the link with new country code
      setSocialLinks((prev) => {
        const existing = prev.find((link) => link.id === id);
        if (!existing) {
          return prev; // Link doesn't exist
        }

        // Only update country code for phone-based platforms
        const isPhoneBased =
          existing.platform === "whatsapp" ||
          existing.platform === "phone" ||
          existing.platform === "viber";
        if (!isPhoneBased) {
          return prev; // Not a phone-based platform
        }

        // Generate new URL with updated country code and current value
        const newUrl = generateUrl(
          existing.platform,
          existing.value || "",
          trimmedCode,
        );

        // Create updated link object
        const updatedLink: SocialLink = {
          ...existing,
          url: newUrl,
          countryCode: trimmedCode,
        };

        // Run validation with the new country code and current value
        const error = validateLink(
          existing.platform,
          existing.value || "",
          trimmedCode,
        );
        setLinkErrors((prevErrors) => {
          if (error) {
            return { ...prevErrors, [id]: error };
          } else {
            const nextErrors = { ...prevErrors };
            delete nextErrors[id];
            return nextErrors;
          }
        });

        // Return new array with updated link
        return prev.map((link) => (link.id === id ? updatedLink : link));
      });
    },
    [validateLink],
  );

  const handleLinkBlur = useCallback(
    (id: string) => {
      const link = socialLinks.find((l) => l.id === id);
      if (!link) return;

      const error = validateLink(
        link.platform,
        link.value || "",
        link.countryCode,
      );
      setLinkErrors((prev) => {
        if (error) {
          return { ...prev, [id]: error };
        } else {
          const next = { ...prev };
          delete next[id];
          return next;
        }
      });
    },
    [socialLinks, validateLink],
  );

  // Validate the complete draft before any uploads or persistence.
  const handleSubmit = async () => {
    if (!beginSubmission()) return;

    try {
      setSubmitError(null);
      if (!slugValid) {
        setOpenSection("basic");
        throw new Error(slugCopy.fix);
      }
      const seoCheck = advancedSeoAllowed
        ? inspectLinktreeSeo(templateConfig.seo, true)
        : { value: undefined, errors: {} };
      setSeoErrors(seoCheck.errors);
      if (Object.keys(seoCheck.errors).length) {
        setOpenSection("seo");
        throw new Error(linktreeSeoCopy(locale).invalidSettings);
      }

      // ============================================
      // VALIDATION CHECKS
      // ============================================

      // Validate all fields before submission
      const fieldErrors: typeof errors = {};
      fieldErrors.name = validateName(name);
      fieldErrors.backgroundColor = validateBackgroundColor(backgroundColor);
      fieldErrors.templateKey = validateTemplateKey(templateKey);
      fieldErrors.platforms = validatePlatforms(selectedPlatforms);
      fieldErrors.links = validateLinks(socialLinks, selectedPlatforms);
      fieldErrors.questions = validateQuestions(
        whatsappQuestions,
        whatsappModalEnabled,
      );
      if (subtitleColor.trim()) {
        const isSolidHex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(
          subtitleColor.trim(),
        );
        if (!isSolidHex) {
          fieldErrors.subtitleColor =
            copy?.hexColorInvalid ?? "ڕەنگ دەبێت کۆدی Hex بێت (وەک #000000)";
        }
      }

      const hasValidationErrors = Object.values(fieldErrors).some(
        (err) => err !== undefined,
      );

      if (hasValidationErrors) {
        setErrors(fieldErrors);
        setTouched({
          name: true,
          backgroundColor: true,
          templateKey: true,
          platforms: true,
          links: true,
          subtitleColor: true,
        });

        let firstErrorMsg =
          copy?.allFieldsRequired ??
          "تکایە هەموو خانە پێویستەکان بە دروستی پڕبکەرەوە.";
        if (fieldErrors.name) {
          firstErrorMsg = fieldErrors.name;
          if (openSection !== "basic") setOpenSection("basic");
          setTimeout(() => document.getElementById("headline")?.focus(), 50);
        } else if (fieldErrors.subtitleColor) {
          firstErrorMsg = fieldErrors.subtitleColor;
          if (openSection !== "basic") setOpenSection("basic");
        } else if (fieldErrors.backgroundColor) {
          firstErrorMsg = fieldErrors.backgroundColor;
          if (openSection !== "basic") setOpenSection("basic");
          document
            .querySelector("[data-bg-color-section]")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (
          fieldErrors.templateKey ||
          !templateKey ||
          !isTemplateKey(templateKey)
        ) {
          firstErrorMsg =
            fieldErrors.templateKey ||
            copy?.templateRequired ||
            "شێوازی پەڕە هەڵبژێرە";
          if (openSection !== "basic") setOpenSection("basic");
          document
            .querySelector("[data-template-section]")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (fieldErrors.platforms) {
          firstErrorMsg = fieldErrors.platforms;
          if (openSection !== "select") setOpenSection("select");
        } else if (fieldErrors.links) {
          firstErrorMsg = fieldErrors.links;
          if (openSection !== "links") setOpenSection("links");
        } else if (fieldErrors.questions) {
          firstErrorMsg = fieldErrors.questions;
          setOpenSection("questions");
        }

        setSubmitError({
          code: "VALIDATION_FAILED",
          title: copy?.incompleteTitle ?? "زانیارییەکان تەواو نین",
          message: firstErrorMsg,
          status: 400,
        });
        throw new Error("Validation failed");
      }

      // Validate name
      const sanitizedName = name.trim();

      // Validate background color
      const selectedBgColor =
        BACKGROUND_COLORS.find((c) => c.id === backgroundColor)?.value ||
        backgroundColor;

      const selectedTemplateKey = isTemplateKey(templateKey)
        ? templateKey
        : TEMPLATE_DEFAULT_ID;

      // Validate links
      if (!selectedPlatforms || selectedPlatforms.length === 0) {
        console.error("لانیکەم یەک پلاتفۆڕمەکان هەڵبژێرە");
        throw new Error("No platforms selected");
      }

      // ============================================
      // IMAGE UPLOAD
      // ============================================
      let imageUrl: string | null = null;
      if (profileImage) {
        try {
          imageUrl = await uploadImage(profileImage, "profile-image");
          if (!imageUrl) {
            console.error("هەڵە لە بارکردنی وێنە");
            throw new Error("Image upload failed");
          }
        } catch (imageError) {
          console.error("Image upload error:", imageError);
          console.error("هەڵە لە بارکردنی وێنە");
          throw imageError;
        }
      } else if (profileImagePreview && !profileImage) {
        // Use existing image URL (only if it's not the default avatar)
        // Don't store default avatar in database - UI will handle it
        if (profileImagePreview !== "/images/DefaultAvatar.png") {
          imageUrl = profileImagePreview;
        }
        // If preview is default avatar, leave imageUrl as null
      }
      // If no image provided, imageUrl stays null - UI will show default avatar

      // A newly picked background is uploaded now; an untouched one keeps the
      // path it was hydrated with, and a removed one resolves to null.
      let backgroundImageUrl: string | null = null;
      if (backgroundImage) {
        backgroundImageUrl = await uploadImage(
          backgroundImage,
          "background-image",
        );
        if (!backgroundImageUrl) {
          throw new Error("Background image upload failed");
        }
      } else if (isBackgroundImageUrl(backgroundImagePreview)) {
        backgroundImageUrl = backgroundImagePreview;
      }

      // ============================================
      // PROCESS LINKS DATA
      // ============================================
      const normalizedLinks = normalizeSelectedSocialLinks(
        socialLinks,
        selectedPlatforms,
      );
      const { urls: processedLinks, metadata: linkMetadata } =
        groupSocialLinksByPlatform(normalizedLinks);
      // Final validation: ensure we have at least one link
      if (Object.keys(processedLinks).length === 0) {
        const hasSelectedPlatforms = selectedPlatforms.length > 0;
        if (hasSelectedPlatforms) {
          console.error("تکایە بەروارەکان بۆ لینکەکان بنووسە");
        } else {
          console.error("لانیکەم یەک پلاتفۆڕمەکان هەڵبژێرە");
        }
        throw new Error("No valid links provided");
      }

      // ============================================
      // SANITIZE TEXT FIELDS
      // ============================================
      const sanitizedSubtitle = subtitle.trim();
      const sanitizedDescription =
        description.trim() || copy?.defaultDescription || DEFAULT_DESCRIPTION;
      // ============================================
      // PREPARE PLATFORMS ARRAY
      // ============================================
      const platforms = Array.from(
        new Set(
          socialLinks
            .filter((l) => selectedPlatforms.includes(l.id))
            .map((l) => l.platform),
        ),
      );

      // ============================================
      // CALL PARENT SUBMIT HANDLER (AWAIT IT)
      // ============================================
      // Store WhatsApp modal config in template_config before normalization
      const templateConfigWithMessage = {
        ...templateConfig,
        seo: !advancedSeoAllowed
          ? templateConfig.seo
          : seoCheck.value
            ? {
                ...seoCheck.value,
                socialImage: seoCheck.value.socialImage
                  ? (
                      await uploadLinktreeBanner(
                        {
                          enabled: true,
                          mode: "image",
                          images: [seoCheck.value.socialImage],
                        },
                        (file) => uploadImage(file, "social-image"),
                      )
                    ).images[0]
                  : undefined,
              }
            : undefined,
        [LINKTREE_BANNER_KEY]: await uploadLinktreeBanner(
          templateConfig[LINKTREE_BANNER_KEY],
          (file) => uploadImage(file, "banner-image"),
        ),
        [BACKGROUND_IMAGE_CONFIG_KEY]: backgroundImageUrl,
        [BACKGROUND_PATTERN_CONFIG_KEY]: backgroundPattern,
        // Include whatsapp_modal with enabled flag
        whatsapp_modal: {
          enabled: whatsappModalEnabled,
          ...(whatsappModalEnabled && whatsappQuestions.length > 0
            ? {
                title:
                  whatsappModalTitle.trim() ||
                  copy?.whatsappTitle ||
                  "پەیوەندی کردن",
                subtitle:
                  whatsappModalSubtitle.trim() ||
                  copy?.whatsappSubtitle ||
                  "پرسیارێک هەڵبژێرە",
                questions: whatsappQuestions.filter(
                  (q) => q.text.trim() && q.message.trim(),
                ),
              }
            : {}),
        },
      };
      const normalizedTemplateConfig = normalizeTemplateConfig(
        selectedTemplateKey,
        templateConfigWithMessage,
      );

      await onSubmit(
        {
          headline: sanitizedName,
          ...(slug ? { slug } : {}),
          slogan: sanitizedSubtitle,
          slogan_color: extractSolidHex(subtitleColor) || undefined,
          description: sanitizedDescription,
          logo: imageUrl,
          background_color: selectedBgColor,
          templateKey: selectedTemplateKey,
          templateConfig: normalizedTemplateConfig,
          platforms: platforms,
          links: processedLinks,
          linkMetadata:
            Object.keys(linkMetadata).length > 0 ? linkMetadata : undefined,
          status,
          ...(isDefault ? { is_default: true } : {}),
        },
        editData?.linktree.id,
      );

      // Note: Modal closing is handled by parent component after successful submission
      // Don't reset isSubmitting here - let the modal close naturally reset the state
      // This keeps the button disabled with spinner until modal closes
    } catch (error) {
      console.error("Error submitting:", error);

      if (error instanceof Error && error.message === "Validation failed") {
        // submitError is already set with the specific field error
      } else if (error && typeof error === "object" && "linkErrors" in error) {
        const linkErrorsData = (
          error as Error & { linkErrors?: Record<string, string> }
        ).linkErrors;
        if (linkErrorsData && Object.keys(linkErrorsData).length > 0) {
          const mappedErrors: Record<string, string> = {};
          const platformLinkCounts = new Map<string, number>();
          selectedPlatforms.forEach((linkId) => {
            const link = socialLinks.find((l) => l.id === linkId);
            if (!link) return;

            const count = platformLinkCounts.get(link.platform) || 0;
            const errorKey = `${link.platform}_${count}`;

            if (linkErrorsData[errorKey]) {
              mappedErrors[linkId] =
                copy?.linkErrorsHint ?? linkErrorsData[errorKey];
            }

            platformLinkCounts.set(link.platform, count + 1);
          });

          if (Object.keys(mappedErrors).length > 0) {
            setLinkErrors(mappedErrors);
            if (openSection !== "links") setOpenSection("links");
          }
        }
        setSubmitError({
          code: "LINK_ERRORS",
          title: copy?.linkErrorsTitle ?? "هەڵە لە لینکەکاندا هەیە",
          message:
            error instanceof Error &&
            error.message &&
            error.message !== "Some links have validation errors"
              ? (copy?.linkErrorsHint ?? error.message)
              : (copy?.linkErrorsHint ??
                "تکایە بەستەر و زانیاری لینکەکان بپشکنە و هەڵەکان چاک بکەوە."),
          status: 400,
        });
      } else {
        const message =
          copy?.saveFailedHint ??
          (error instanceof Error && error.message
            ? error.message
            : "هەڵەیەک ڕوویدا لە کاتی پاشەکەوتکردن. تکایە دووبارە هەوڵبدەوە.");
        setSubmitError({
          code: "SUBMIT_FAILED",
          title: copy?.saveFailedTitle ?? "پاشەکەوتکردن سەرکەوتوو نەبوو",
          message,
          status: 400,
        });
      }

      // ALWAYS reset submission flag on error so user can retry
      resetSubmission();
    }
  };

  // Drag and keyboard ordering share the same stable-ID operation.
  const handleReorderLinks = useCallback(
    (source: string, target: string) => {
      setSocialLinks((previous) =>
        reorderSocialLinks(previous, selectedPlatforms, source, target),
      );
    },
    [selectedPlatforms],
  );
  // Check if there are any valid links (with values filled in) - optimized
  const hasValidLinks = useMemo(() => {
    if (selectedPlatforms.length === 0) return false;

    // Create a map for O(1) lookup instead of O(n) find
    const linksMap = new Map(socialLinks.map((link) => [link.id, link]));

    // Every selected platform must have a completed, valid link.
    for (const linkId of selectedPlatforms) {
      const link = linksMap.get(linkId);
      if (!link) return false;

      // Check if link has a value (user has filled in the input)
      const hasValue = link.value && link.value.trim();
      if (!hasValue) return false;

      if (validateLink(link.platform, link.value || "", link.countryCode)) {
        return false;
      }

      // Generate URL to verify it's valid
      const linkUrl =
        link.url && link.url.trim()
          ? link.url
          : generateUrl(link.platform, link.value || "", link.countryCode);

      if (!linkUrl || !linkUrl.trim()) return false;
    }

    return true;
  }, [selectedPlatforms, socialLinks, validateLink]);

  const openImageCrop = (
    kind: "profile" | "background",
    returnFocus: HTMLElement,
  ) => {
    const src =
      kind === "profile" ? profileImagePreview : backgroundImagePreview;
    if (!src || !isLocalRasterImageWithinLimit(src, 14_000_000)) return;
    const draftId = initializedLinktreeIdRef.current;
    setCropRequest({
      src,
      returnFocus,
      aspect: "free",
      maxEdge: kind === "profile" ? 720 : 1440,
      allowWebp: false,
      onConfirm: async (file) => {
        const validationError = validateUploadFile(file, {
          allowedMimeTypes: ["image/png", "image/jpeg"],
          maxBytes: 10 * 1024 * 1024,
        });
        if (validationError) throw new Error("Invalid crop output");
        const preview = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("Unable to read crop"));
          reader.onload = () =>
            typeof reader.result === "string"
              ? resolve(reader.result)
              : reject(new Error("Invalid crop"));
          reader.readAsDataURL(file);
        });
        if (initializedLinktreeIdRef.current !== draftId)
          throw new Error("Draft changed during crop");
        if (kind === "profile") {
          setProfileImage(file);
          setProfileImagePreview(preview);
        } else {
          setBackgroundImage(file);
          setBackgroundImagePreview(preview);
        }
        setUploadError(null);
      },
    });
  };

  const drawerCopy = editorDrawerCopy(locale);
  const rawSeo = templateConfig.seo;
  const seoDraft: LinktreeSeo =
    rawSeo &&
    typeof rawSeo === "object" &&
    !Array.isArray(rawSeo) &&
    (rawSeo as { version?: unknown }).version === 1
      ? (rawSeo as LinktreeSeo)
      : { version: 1 };
  const updateSeo = (seo: LinktreeSeo) => {
    setTemplateConfig((current) => ({ ...current, seo }));
    if (Object.keys(seoErrors).length)
      setSeoErrors(inspectLinktreeSeo(seo, true).errors);
  };
  const previewDraft = useMemo<LinktreeEditorPreviewDraft>(
    () => ({
      name: name || businessIdentity?.name || "",
      subtitle,
      subtitleColor,
      description,
      slug: slug || editData?.linktree.seo_name || "",
      image: profileImagePreview,
      backgroundColor,
      backgroundImage: backgroundImagePreview,
      templateKey,
      templateConfig: {
        ...templateConfig,
        seo: readPlanLinktreeSeo(templateConfig.seo, advancedSeoAllowed, true),
        [BACKGROUND_IMAGE_CONFIG_KEY]: backgroundImagePreview,
        [BACKGROUND_PATTERN_CONFIG_KEY]: backgroundPattern,
      },
      socialLinks,
      accentColor: businessTheme.raw,
    }),
    [
      name,
      businessIdentity?.name,
      subtitle,
      subtitleColor,
      description,
      editData?.linktree.seo_name,
      slug,
      profileImagePreview,
      backgroundColor,
      templateKey,
      templateConfig,
      backgroundImagePreview,
      backgroundPattern,
      socialLinks,
      businessTheme.raw,
      advancedSeoAllowed,
    ],
  );
  const deferredPreview = useDeferredValue(previewDraft);

  return (
    <ManagementDrawer
      isOpen={isOpen}
      onClose={() => {
        if (cropBusy || isSubmitting || managementBusy) return;
        if (cropRequest) cancelCrop();
        else if (duplicating) setDuplicating(false);
        else onClose();
      }}
      title={
        cropRequest
          ? cropCopy.title
          : duplicating
            ? businessMessages[locale].DuplicateLinktree.title
            : isEditMode
              ? (copy?.editPage ?? "دەستکاریکردنی پەڕە")
              : isDefault
                ? (copy?.createDefaultPage ?? "دروستکردنی پەڕەی بنەڕەتی")
                : (copy?.createPage ?? "پەڕەی نوێ دروست بکە")
      }
      extraWide
      compactHeader
      bodyLayout="contained"
      busy={isSubmitting || cropBusy || managementBusy}
      createBusinessStyle
      sponsorKrdTheme={platformTheme}
      closeLabel={copy?.close}
      headerAction={headerControls}
      // Business editors use the tenant's complete colour value (including a
      // gradient). Platform editors keep the system gradient for their chrome;
      // the page background being designed remains independent in the preview.
      accentColor={platformTheme ? null : businessTheme.raw}
      footer={
        cropRequest ? (
          <div
            ref={setCropFooter}
            data-crop-footer
            className="flex w-full gap-3"
          />
        ) : duplicating ? (
          <div
            ref={setDuplicateFooter}
            className="flex w-full justify-end gap-3"
          />
        ) : (
          <LinktreeEditorActions
            editing={isEditMode}
            locale={locale}
            loading={isLoadingEditData || managementBusy || !slugValid}
            saving={isSubmitting}
            managementActions={
              !isLoadingEditData && management ? (
                <LinktreeEditorPageActions
                  management={management}
                  locale={locale}
                  disabled={isSubmitting || managementBusy}
                  onBusyChange={setManagementBusy}
                  onDuplicate={() => setDuplicating(true)}
                />
              ) : undefined
            }
            valid={hasValidLinks && !validateName(name)}
            copy={copy}
            onClose={() => {
              if (!managementBusy) onClose();
            }}
            onSubmit={() => {
              void handleSubmit();
            }}
          />
        )
      }
    >
      {cropRequest && (
        <EditorImageCropWorkspace
          request={cropRequest}
          copy={cropCopy}
          cancelLabel={copy?.cancel ?? "پاشگەزبوونەوە"}
          onCancel={cancelCrop}
          onBusyChange={setCropBusy}
          footerTarget={cropFooter}
        />
      )}
      {duplicating && management && editData && (
        <div
          hidden={!!cropRequest}
          className={
            cropRequest
              ? "hidden"
              : "min-h-0 flex-1 overflow-y-auto lg:h-full lg:overflow-hidden"
          }
        >
          <LinktreeDuplicateWorkspace
            key={management.item.id}
            item={management.item}
            source={editData}
            locale={locale}
            platformTheme={platformTheme}
            accentColor={businessTheme.raw}
            copy={copy}
            colorCopy={colorCopy}
            footerTarget={duplicateFooter}
            requestCrop={setCropRequest}
            uploadImage={uploadImage}
            onBusyChange={setManagementBusy}
            onCancel={() => setDuplicating(false)}
            onSuccess={() => {
              setDuplicating(false);
              management.onDuplicated?.();
            }}
          />
        </div>
      )}
      <div
        hidden={!!cropRequest || duplicating}
        dir="ltr"
        className={
          cropRequest || duplicating
            ? "hidden"
            : "flex min-h-0 flex-col lg:h-full"
        }
      >
        {submitError && (
          <InlineRequestError className="mb-4" error={submitError} />
        )}
        {uploadError && (
          <InlineRequestError
            className="mb-4"
            error={localizeEditorUploadError(uploadError, copy)}
          />
        )}
        {/* Loading state mirrors the editor sections to prevent layout shift. */}
        {isLoadingEditData && (
          <LinktreeEditorLoadingContent
            copy={copy}
            label={drawerCopy.loadingInformation}
            previewLabel={drawerCopy.preview}
          />
        )}

        {!isLoadingEditData && (
          <fieldset
            disabled={isSubmitting || managementBusy}
            className="contents"
          >
            <EditorPreviewLayout
              direction={locale === "en" ? "ltr" : "rtl"}
              previewLabel={drawerCopy.preview}
              preview={
                <LinktreeEditorPreviewPanel
                  draft={deferredPreview}
                  whatsappPreview={{
                    enabled: whatsappModalEnabled,
                    open: openSection === "questions",
                    title: whatsappModalTitle,
                    subtitle: whatsappModalSubtitle,
                    questions: whatsappQuestions,
                    onClose: () => setOpenSection(null),
                  }}
                  locale={locale}
                  label={drawerCopy.preview}
                  designControls={{
                    locale,
                    copy,
                    templateKey,
                    backgroundPattern,
                    onTemplateChange: handleTemplateKeyChange,
                    onPatternChange: setBackgroundPattern,
                    templateError: touched.templateKey
                      ? errors.templateKey
                      : undefined,
                  }}
                  value={backgroundColor}
                  onChange={handleBackgroundColorChange}
                  onBlur={handleBackgroundColorBlur}
                  imagePreview={backgroundImagePreview}
                  onImageChange={handleBackgroundImageChange}
                  onImageRemove={handleRemoveBackgroundImage}
                  onImageCrop={
                    backgroundImagePreview &&
                    isLocalRasterImageWithinLimit(
                      backgroundImagePreview,
                      14_000_000,
                    )
                      ? (target) => openImageCrop("background", target)
                      : undefined
                  }
                  cropLabel={cropCopy.title}
                  colorCopy={colorCopy}
                  imageLabel={copy?.backgroundImage}
                  imageRemoveLabel={copy?.removeBackgroundImage}
                  error={
                    touched.backgroundColor ? errors.backgroundColor : undefined
                  }
                />
              }
            >
              <div className="space-y-3">
                <LinktreeBannerEditor
                  locale={locale}
                  banner={readLinktreeBanner(
                    templateConfig[LINKTREE_BANNER_KEY],
                    isFormImage,
                  )}
                  onChange={(banner) =>
                    setTemplateConfig((previous) => ({
                      ...previous,
                      [LINKTREE_BANNER_KEY]: banner,
                    }))
                  }
                  open={openSection === "banner"}
                  onToggle={() =>
                    setOpenSection(openSection === "banner" ? null : "banner")
                  }
                  requestCrop={setCropRequest}
                />
                <EditorSection
                  title={copy?.basicStep ?? "زانیارییەکان"}
                  open={openSection === "basic"}
                  onToggle={() =>
                    setOpenSection(openSection === "basic" ? null : "basic")
                  }
                >
                  <BasicInfoStep
                    slugField={<DuplicateSlugField
                      check={{ ...slugCheck, slug, setSlug: (value) => setSlug(value.toLowerCase()) }}
                      locale={locale}
                      pageType="linktree"
                      optional={!editData}
                      maxLength={255}
                      help={editData && slug !== (editData.linktree.seo_name ?? "") ? slugCopy.warning : !editData ? slugCopy.automatic : undefined}
                    />}
                    categoryFields={
                      advancedSeoAllowed ? (
                        <LinktreeCategoryFields
                          seo={seoDraft}
                          onChange={updateSeo}
                          locale={locale}
                        />
                      ) : undefined
                    }
                    copy={copy}
                    colorCopy={colorCopy}
                    logoPreview={profileImagePreview}
                    hideRemoveLogo={
                      !profileImage && !!businessDefaults?.default_avatar
                    }
                    fileInputRef={fileInputRef}
                    headline={name}
                    verificationBadge={
                      templateConfig.verification_badge === true
                    }
                    onVerificationBadgeChange={(value) =>
                      setTemplateConfig((prev) => ({
                        ...prev,
                        verification_badge: value,
                      }))
                    }
                    slogan={subtitle}
                    description={description}
                    errors={{
                      headline: errors.name,
                      sloganColor: errors.subtitleColor,
                      logo: errors.image,
                    }}
                    headlineWarning={nameWarning}
                    checkingHeadline={checkingName}
                    touched={{ headline: touched.name }}
                    onLogoChange={handleImageChange}
                    onRemoveLogo={handleRemoveImage}
                    onCropLogo={
                      profileImagePreview &&
                      isLocalRasterImageWithinLimit(
                        profileImagePreview,
                        14_000_000,
                      )
                        ? (target) => openImageCrop("profile", target)
                        : undefined
                    }
                    cropLabel={cropCopy.title}
                    onHeadlineChange={handleNameChange}
                    onHeadlineBlur={handleNameBlur}
                    onSloganChange={setSubtitle}
                    sloganColor={subtitleColor}
                    onSloganColorChange={setSubtitleColor}
                    onDescriptionChange={(value) => {
                      authoredText.current.add("description");
                      setDescription(value);
                    }}
                  />
                </EditorSection>

                {advancedSeoAllowed && (
                  <EditorSection
                    title={linktreeSeoCopy(locale).section}
                    open={openSection === "seo"}
                    onToggle={() =>
                      setOpenSection(openSection === "seo" ? null : "seo")
                    }
                  >
                    <LinktreeSeoEditor
                      seo={seoDraft}
                      onChange={updateSeo}
                      locale={locale}
                      errors={seoErrors}
                      headline={name}
                      slogan={subtitle}
                      description={description}
                      requestCrop={setCropRequest}
                    />
                  </EditorSection>
                )}
                <EditorSection
                  title={copy?.selectStep ?? "پلاتفۆڕمەکان"}
                  open={openSection === "select"}
                  onToggle={() =>
                    setOpenSection(openSection === "select" ? null : "select")
                  }
                >
                  <PlatformSelectionStep
                    copy={copy}
                    socialLinks={socialLinks}
                    error={errors.platforms}
                    touched={touched.platforms}
                    onTogglePlatform={togglePlatform}
                  />
                </EditorSection>

                <EditorSection
                  title={copy?.linksStep ?? "لینکەکان"}
                  open={openSection === "links"}
                  onToggle={() =>
                    setOpenSection(openSection === "links" ? null : "links")
                  }
                >
                  <LinksStep
                    copy={copy}
                    colorCopy={colorCopy}
                    selectedPlatforms={selectedPlatforms}
                    socialLinks={socialLinks}
                    linkErrors={linkErrors}
                    error={errors.links}
                    touched={touched.links}
                    onUpdateLink={updateSocialLink}
                    onUpdateCountryCode={updateCountryCode}
                    onUpdateDisplayName={updateDisplayName}
                    onUpdateCustomColor={updateCustomColor}
                    onUpdateCustomIcon={updateCustomIcon}
                    onRemoveLink={removeLinkInstance}
                    onAddPlatformInstance={addPlatformInstance}
                    onReorderLink={handleReorderLinks}
                    onBlurLink={handleLinkBlur}
                  />
                </EditorSection>
                <EditorSection
                  title={copy?.whatsappQuestions ?? "پرسیارەکانی واتساپ"}
                  enabled={whatsappModalEnabled}
                  onEnabled={setWhatsappModalEnabled}
                  open={openSection === "questions"}
                  onToggle={() =>
                    setOpenSection(
                      openSection === "questions" ? null : "questions",
                    )
                  }
                >
                  <LinktreeQuestionsEditor
                    copy={copy}
                    whatsappModalEnabled={whatsappModalEnabled}
                    whatsappModalTitle={whatsappModalTitle}
                    whatsappModalSubtitle={whatsappModalSubtitle}
                    whatsappQuestions={whatsappQuestions}
                    questionErrors={questionErrors}
                    onWhatsappModalTitleChange={(value) => {
                      authoredText.current.add("whatsappTitle");
                      setWhatsappModalTitle(value);
                    }}
                    onWhatsappModalSubtitleChange={(value) => {
                      authoredText.current.add("whatsappSubtitle");
                      setWhatsappModalSubtitle(value);
                    }}
                    onWhatsappQuestionsChange={updateWhatsappQuestions}
                  />
                </EditorSection>
              </div>
            </EditorPreviewLayout>
          </fieldset>
        )}
      </div>
    </ManagementDrawer>
  );
});
