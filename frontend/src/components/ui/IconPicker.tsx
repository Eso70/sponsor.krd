"use client";

import { MotionSpinner } from "@/components/motion/MotionPrimitives";

import React, { useState, useMemo, useRef, useEffect, useId } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { CUSTOM_ICONS_MAP, ICON_CATEGORIES } from "@/lib/config/icons";
import { ImagePlus, LoaderCircle, Search, X } from "lucide-react";
import { useAnchoredPopup } from "@/hooks/useAnchoredPopup";
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
import {
  encodeUploadedIconValue,
  imageHasOpaqueBackground,
  parseUploadedIconValue,
} from "@/features/link-editor/custom-icon-value";
import { Tooltip } from "@/components/shared/Tooltip";
import { InlineRequestError } from "@/components/shared/InlineRequestError";
import {
  createUploadFailureError,
  inlineRequestErrorFromResponse,
  type InlineRequestErrorData,
  validateUploadFile,
} from "@/lib/api/inline-request-error";
import { enqueueImageUpload } from "@/lib/api/enqueue-image-upload";
import { EDITOR_IMAGE_ACTION_CLASS } from "@/components/shared/editor-control-styles";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { SHARED_CONTROL_CLASS, SHARED_INSET_CONTROL_CLASS, SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";
import { IconPickerOption } from "./IconPickerOption";
import styles from "./IconPicker.module.css";
import surfaceStyles from "@/components/shared/picker-popup-surface.module.css";
import { pickerAppearance } from "@/lib/utils/picker-appearance";

interface IconPickerProps {
  copy?: Partial<Record<"choose" | "library" | "icon" | "title" | "search" | "close" | "upload" | "clear" | "icons" | "noResults" | "loading", string>> & { categories?: Partial<Record<CategoryKey, string>> };
  value: string;
  onChange: (iconName: string) => void;
  customTrigger?: React.ReactNode;
  uploadUrl?: string;
  localizeError?: (error: InlineRequestErrorData) => InlineRequestErrorData;
}

type CategoryKey = keyof typeof ICON_CATEGORIES;

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  all: "All",
  lucide: "Lucide",
  fontAwesome: "Font Awesome",
  bootstrap: "Bootstrap",
  tabler: "Tabler",
  material: "Material",
  antDesign: "Ant Design",
  simpleIcons: "Simple Icons",
};

export function IconPicker({
  copy,
  value,
  onChange,
  customTrigger,
  uploadUrl = "/api/linktrees/upload",
  localizeError,
}: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const [visibleCount, setVisibleCount] = useState(120);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] =
    useState<InlineRequestErrorData | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const popupId = useId();
  const [portalDocument, setPortalDocument] = useState<Document | null>(null);
  const [popupDark, setPopupDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const closePopup = React.useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);
  const popupStyle = useAnchoredPopup({
    isOpen: isOpen && mounted,
    anchorRef: triggerRef,
    popupRef,
    onClose: closePopup,
  });
  const togglePopup = () => {
    setPortalDocument(triggerRef.current?.ownerDocument ?? document);
    setPopupDark(pickerAppearance(triggerRef.current) === "dark");
    setIsOpen((current) => !current);
  };

  // - Filtered icons -
  const filteredIcons = useMemo(() => {
    const iconNames = ICON_CATEGORIES[activeCategory] || [];
    if (!searchQuery) return iconNames;
    const lowerQuery = searchQuery.toLowerCase();
    return iconNames.filter((name) => name.toLowerCase().includes(lowerQuery));
  }, [activeCategory, searchQuery]);

  const renderedIcons = useMemo(() => filteredIcons.slice(0, visibleCount), [filteredIcons, visibleCount]);

  // Reset scroll & page when category or search changes
  // Wrapped in startTransition to satisfy react-hooks/set-state-in-effect
  useEffect(() => {
    React.startTransition(() => {
      setVisibleCount(120);
    });
    if (gridContainerRef.current) gridContainerRef.current.scrollTop = 0;
  }, [activeCategory, searchQuery]);

  // - IntersectionObserver infinite scroll -
  useEffect(() => {
    const container = gridContainerRef.current;
    const sentinel = sentinelRef.current;
    if (!container || !sentinel || !isOpen || filteredIcons.length <= visibleCount) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting)
          setVisibleCount((prev) => Math.min(prev + 120, filteredIcons.length));
      },
      { root: container, rootMargin: "250px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isOpen, filteredIcons.length, visibleCount]);

  // - Mount / keyboard / focus effects -
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);


  // - Derived values -
  const SelectedIcon =
    value && CUSTOM_ICONS_MAP[value] ? CUSTOM_ICONS_MAP[value] : CUSTOM_ICONS_MAP["Link"];
  const uploadedIcon = parseUploadedIconValue(value);

  const handleIconClick = React.useCallback(
    (iconName: string) => { onChange(iconName); closePopup(); },
    [onChange, closePopup]
  );

  const handleImageUpload = React.useCallback(
    async (file?: File) => {
      if (!file) return;
      setUploadError(null);
      const validationError = validateUploadFile(file, {
        allowedMimeTypes: ["image/png", "image/jpeg"],
        maxBytes: 5 * 1024 * 1024,
      });
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      setUploading(true);
      try {
        await enqueueImageUpload(async () => {
          try {
            const hasBackground = await imageHasOpaqueBackground(file);
            const form = new FormData();
            form.append("file", file);
            form.append("assetType", "social-icon");
            const response = await fetch(uploadUrl, {
              method: "POST",
              credentials: "include",
              body: form,
            });
            const payload = await response.json().catch(() => ({}));
            const url = payload?.data?.url || payload?.url;
            if (!response.ok || typeof url !== "string") {
              setUploadError(inlineRequestErrorFromResponse(response));
              return null;
            }
            onChange(encodeUploadedIconValue({ url, hasBackground }));
            return url;
          } catch {
            setUploadError(createUploadFailureError());
            return null;
          }
        });
        setIsOpen(false);
      } finally {
        setUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    },
    [onChange, uploadUrl],
  );

  useModalKeyboard({
    isOpen: isOpen && mounted,
    dialogRef: popupRef,
    initialFocusRef: searchInputRef,
    onEscape: closePopup,
    onEnter: () => {
      const selectedIcon = renderedIcons.includes(value) ? value : renderedIcons[0];
      if (selectedIcon) handleIconClick(selectedIcon);
    },
  });

  // - Trigger button -
  const triggerContent = customTrigger ? (
    <button
      ref={triggerRef}
      type="button"
      aria-label={copy?.choose ?? "دیاریکردنی ئایکۆن"}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-controls={isOpen ? popupId : undefined}
      onClick={togglePopup}
      className="block shrink-0 rounded-lg cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {customTrigger}
    </button>
  ) : (
    <Tooltip content={copy?.choose ?? "دیاریکردنی ئایکۆن"} side="top">
      <button
        type="button"
        ref={triggerRef}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? popupId : undefined}
        onClick={togglePopup}
        className={`${SHARED_SOFT_BUTTON_CLASS} group relative flex size-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden sm:size-11`}
        style={{ '--tw-ring-color': 'color-mix(in srgb, var(--theme-primary, #64748b) 30%, transparent)' } as React.CSSProperties}
        title={copy?.choose ?? "ئاڕاستەی ئایکۆن (Choose Icon)"}
        aria-label={copy?.choose ?? "دیاریکردنی ئایکۆن"}
      >
        {uploadedIcon ? (
          <Image
            src={uploadedIcon.url}
            alt=""
            width={48}
            height={48}
            className={`h-full w-full ${uploadedIcon.hasBackground ? "object-cover" : "object-contain p-2"}`}
            unoptimized
          />
        ) : value && CUSTOM_ICONS_MAP[value] ? (
          <SelectedIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300   duration-300" />
        ) : (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold">
            {copy?.icon ?? "ئایکۆن"}
          </div>
        )}
      </button>
    </Tooltip>
  );

  if (!mounted) return <div className="relative">{triggerContent}</div>;

  const popupContent = isOpen ? (
    <div className={popupDark ? "dark" : "light"}>
      <div
        ref={popupRef}
        data-picker-surface
        id={popupId}
        role="dialog"
        aria-modal={false}
        aria-label={copy?.title ?? "ئایکۆن هەڵبژێرە"}
        style={popupStyle}
        data-appearance={popupDark ? "dark" : "light"}
        className={`${surfaceStyles.surface} fixed z-[201] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-[#161B22] dark:text-slate-300`}
        dir="ltr"
        onClick={(e) => e.stopPropagation()}
      >
        {/* - Search - */}
        <div className={`${styles.searchRow} shrink-0 px-3 pb-2 pt-3`}>
          <div className="relative">
            {/* Icon is a sibling of <input>, not inside - prevents backdrop-blur clash */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10 pointer-events-none text-slate-400 dark:text-gray-500" />
            <input
              ref={searchInputRef}
              data-icon-picker-search
              type="text"
              placeholder={copy?.search ?? "گەڕان لە ئایکۆنەکان"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={copy?.search ?? "گەڕان لە ئایکۆنەکان"}
              className={`${SHARED_CONTROL_CLASS} ${SHARED_INSET_CONTROL_CLASS} ${styles.search}`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                  searchInputRef.current?.focus({ preventScroll: true });
                }}
                aria-label={copy?.clear ?? "Clear"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg z-10 transition-colors duration-200
                  text-slate-400 dark:text-gray-500
                  hover:text-slate-700 dark:hover:text-gray-200
                  hover:bg-slate-100 dark:hover:bg-white/8"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 px-3 pb-2">
          <div className="min-w-0 flex-1">
            <CustomSelect
              label={copy?.library ?? "کتێبخانەی ئایکۆن"}
              hideLabel
              value={activeCategory}
              onChange={setActiveCategory}
              inheritAppearance
              portalContainerRef={popupRef}
              maxMenuHeight={240}
              minMenuWidth={180}
              triggerClassName="!h-9 !px-3 !text-xs"
              options={(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((category) => ({
                value: category,
                label: copy?.categories?.[category] ?? CATEGORY_LABELS[category],
              }))}
            />
          </div>
          <span className="shrink-0 text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
            {filteredIcons.length} {copy?.icons ?? "ئایکۆن"}
          </span>
        </div>

        {/* - Icon Grid - */}
        <div
          ref={gridContainerRef}
          className="custom-scrollbar theme-custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-3"
        >
          <div className={styles.grid}>
            {renderedIcons.map((iconName) => (
              <IconPickerOption
                key={iconName}
                iconName={iconName}
                isSelected={value === iconName}
                onClick={handleIconClick}
              />
            ))}
          </div>

          {filteredIcons.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400 dark:text-slate-500">
              <Search className="size-6 opacity-50" />
              <span className="text-xs">{copy?.noResults ?? "No icons found for"} &ldquo;{searchQuery}&rdquo;</span>
            </div>
          )}

          {/* Sentinel - triggers IntersectionObserver lazy load */}
          {filteredIcons.length > visibleCount && (
            <div
              ref={sentinelRef}
              className="flex justify-center items-center gap-2 mt-4 py-4 border-t border-slate-100/50 dark:border-white/5 text-xs text-slate-400 dark:text-gray-600"
            >
              <MotionSpinner>
                <span
                  className="h-4 w-4 rounded-full border-2 border-slate-200 dark:border-white/12"
                  style={{ borderTopColor: 'var(--theme-primary, #64748b)' }}
                />
              </MotionSpinner>
              <span>{copy?.loading ?? "Loading more icons..."}</span>
            </div>
          )}
        </div>

        {/* - Footer - */}
        <div className="flex shrink-0 items-center gap-2 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(event) =>
                void handleImageUpload(event.target.files?.[0])
              }
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className={`${EDITOR_IMAGE_ACTION_CLASS} disabled:cursor-wait`}
            >
              {uploading ? (
                <MotionSpinner><LoaderCircle className="h-4 w-4 "  /></MotionSpinner>
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {copy?.upload ?? "بارکردنی وێنە"}
            </button>
            <button
              type="button"
              onClick={() => { onChange(""); closePopup(); }}
              className={EDITOR_IMAGE_ACTION_CLASS}
            >
              {copy?.clear ?? "سڕینەوە"}
            </button>
          </div>

        </div>
        {uploadError && (
          <InlineRequestError
            error={localizeError ? localizeError(uploadError) : uploadError}
            className="mx-3 mb-3 shrink-0"
          />
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="relative" dir="ltr">
      {triggerContent}
      {mounted && popupContent && portalDocument && createPortal(popupContent, portalDocument.body)}
    </div>
  );
}
