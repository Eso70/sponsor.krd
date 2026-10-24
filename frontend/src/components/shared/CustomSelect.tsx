"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { anchoredPopupPosition } from "@/lib/utils/anchored-popup-position";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, type LucideIcon } from "lucide-react";
import styles from "./CustomSelect.module.css";
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
import surfaceStyles from "./picker-popup-surface.module.css";
import { pickerAppearance } from "@/lib/utils/picker-appearance";
import { PickerPopupHeader } from "./PickerPopupHeader";
import { SHARED_CONTROL_CLASS, SHARED_INSET_CONTROL_CLASS, SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
import {
  isWebsiteColor,
  parseWebsiteColor,
  readableInk,
} from "@/lib/utils/parse-website-color";

export interface CustomSelectOption<T extends string> {
  value: T;
  label: string;
  group?: string;
  disabled?: boolean;
  searchTerms?: string[];
  icon?: LucideIcon;
}

interface CustomSelectProps<T extends string> {
  label: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  inheritAppearance?: boolean;
  value: T;
  options: CustomSelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  hideLabel?: boolean;
  triggerClassName?: string;
  labelClassName?: string;
  fullWidth?: boolean;
  required?: boolean;
  showRequirement?: boolean;
  accent?: string;
  emptyLabel?: string;
  /** Optional fixed trigger text; the menu still indicates the selected value. */
  triggerLabel?: string;
  /** Action menus can have no selected option while retaining their trigger label. */
  allowEmptySelection?: boolean;
  placement?: "auto" | "top";
  maxMenuHeight?: number;
  minMenuWidth?: number;
  /** Icon cards for content pickers, retaining the shared portal/dismissal behavior. */
  menuLayout?: "list" | "grid";
  /** Keeps nested menus inside their owning popup's dismissal boundary. */
  portalContainerRef?: RefObject<HTMLElement | null>;
  menuTitle?: string;
  closeLabel?: string;
}

export function CustomSelect<T extends string>({
  label,
  ariaLabel,
  ariaDescribedBy,
  ariaInvalid,
  searchable = false,
  searchPlaceholder = label,
  inheritAppearance = false,
  value,
  options,
  onChange,
  disabled = false,
  hideLabel = false,
  triggerClassName,
  labelClassName,
  fullWidth = true,
  triggerLabel,
  allowEmptySelection = false,
  placement = "auto",
  maxMenuHeight = 176,
  minMenuWidth = 0,
  menuLayout = "list",
  portalContainerRef,
  menuTitle,
  closeLabel = "Close",
  required = false,
  showRequirement = false,
  accent,
  emptyLabel = "هیچ هەڵبژاردەیەک نییە",
}: CustomSelectProps<T>) {
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);
  const [portalThemeStyle, setPortalThemeStyle] = useState<CSSProperties>();
  const [portalDark, setPortalDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const firstOptionRef = useRef<HTMLButtonElement>(null);
  const [initialFocusValue, setInitialFocusValue] = useState<T | null>(null);
  const typeahead = useRef({ text: "", time: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected =
    options.find((option) => option.value === value) ||
    (allowEmptySelection ? undefined : options[0]);
  const hasOptions = options.length > 0;
  const normalizeSearch = (text: string) =>
    text.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase().trim();
  const query = normalizeSearch(searchQuery);
  const displayedOptions =
    searchable && query
      ? options.filter((option) =>
          (option.searchTerms ?? [option.label]).some((term) =>
            normalizeSearch(term).startsWith(query),
          ),
        )
      : options;

  function findTypedOption(key: string, reset = false) {
    const now = Date.now();
    const previous = !reset && now - typeahead.current.time < 700 ? typeahead.current.text : "";
    const text = previous + normalizeSearch(key);
    typeahead.current = { text, time: now };
    const repeated = [...text].every((letter) => letter === text[0]);
    const prefix = repeated ? text[0] : text;
    const enabled = displayedOptions.filter((option) => !option.disabled);
    const focusedValue = menuRef.current?.ownerDocument.activeElement?.getAttribute("data-option-value");
    const currentIndex = enabled.findIndex((option) => option.value === focusedValue);
    const start = previous && repeated ? currentIndex + 1 : 0;
    for (let offset = 0; offset < enabled.length; offset++) {
      const option = enabled[(start + offset) % enabled.length];
      if (normalizeSearch(option.label).startsWith(prefix)) return option;
    }
    return undefined;
  }

  const accentStyle = (() => {
    if (!accent) return undefined;
    if (!isWebsiteColor(accent)) {
      return { "--theme-primary": accent } as CSSProperties;
    }

    const parsed = parseWebsiteColor(accent);
    return {
      "--theme-primary": parsed.primary,
      "--theme-css": parsed.css,
      "--theme-ink": readableInk(parsed.primary),
    } as CSSProperties;
  })();

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const ownerWindow = trigger.ownerDocument.defaultView ?? window;
    const rect = trigger.getBoundingClientRect();

    // The menu is portaled to <body>, so explicitly carry the effective theme
    // variables across that boundary instead of falling back to a solid color.
    const computedStyle = ownerWindow.getComputedStyle(trigger);
    const effectiveDark = pickerAppearance(trigger) === "dark";
    setPortalDark(effectiveDark);
    const inheritedTheme = [
      "--theme-primary",
      "--theme-css",
      "--theme-ink",
      "--theme-text-primary",
      "--sponsor-krd-accent",
      "--sponsor-krd-accent-gradient",
      "--sponsor-krd-accent-ink",
      "--shared-control-surface",
      "--shared-control-hover",
      "--shared-control-text",
      "--shared-control-muted",
      "--shared-control-radius",
    ].reduce<Record<string, string>>((variables, property) => {
      const propertyValue = computedStyle.getPropertyValue(property).trim();
      if (propertyValue) variables[property] = propertyValue;
      return variables;
    }, {});
    inheritedTheme["--select-neutral-border"] = effectiveDark
      ? "rgb(255 255 255 / 10%)"
      : "#e2e8f0";
    if (inheritAppearance) {
      Object.assign(inheritedTheme, {
        "--select-surface": menuTitle ? (effectiveDark ? "#161b22" : "#ffffff") : computedStyle.backgroundColor,
        "--select-font-size": computedStyle.fontSize,
        "--select-option-height": `${Math.min(44, Math.max(36, rect.height))}px`,
        "--select-text": computedStyle.color,
        "--select-border": inheritedTheme["--select-neutral-border"],
        "--select-color-scheme": computedStyle.colorScheme,
      });
    }
    setPortalThemeStyle(inheritedTheme as CSSProperties);

    const gap = 6;
    const optionHeight = inheritAppearance
      ? Math.min(44, Math.max(36, rect.height))
      : 36;
    const estimatedMenuHeight = Math.min(
      maxMenuHeight,
      menuLayout === "grid"
        ? Math.ceil(options.length / (ownerWindow.innerWidth < 480 ? 2 : 4)) * 108 +
            16
        : options.length * optionHeight + Math.max(0, options.length - 1) * 4 + 8,
    );
    setMenuPosition(anchoredPopupPosition({
      anchor: rect, ownerWindow, width: Math.max(rect.width, minMenuWidth),
      maxHeight: maxMenuHeight, preferredHeight: estimatedMenuHeight + (searchable ? 56 : 0),
      gap, margin: 8, preferTop: placement === "top",
    }));
  }, [
    options.length,
    searchable,
    placement,
    maxMenuHeight,
    minMenuWidth,
    menuLayout,
    inheritAppearance,
    menuTitle,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    const ownerDocument = triggerRef.current?.ownerDocument ?? document;
    const ownerWindow = ownerDocument.defaultView ?? window;
    updateMenuPosition();
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    ownerDocument.addEventListener("mousedown", handleOutsideClick);
    ownerWindow.visualViewport?.addEventListener("resize", updateMenuPosition);
    ownerWindow.visualViewport?.addEventListener("scroll", updateMenuPosition);
    ownerWindow.addEventListener("resize", updateMenuPosition);
    ownerWindow.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      ownerDocument.removeEventListener("mousedown", handleOutsideClick);
      ownerWindow.visualViewport?.removeEventListener("resize", updateMenuPosition);
      ownerWindow.visualViewport?.removeEventListener("scroll", updateMenuPosition);
      ownerWindow.removeEventListener("resize", updateMenuPosition);
      ownerWindow.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  useModalKeyboard({
    isOpen: isOpen && menuPosition !== null,
    dialogRef: menuRef,
    initialFocusRef: searchable
      ? searchRef
      : menuLayout === "grid"
        ? undefined
        : firstOptionRef,
    onEscape: () => setIsOpen(false),
    enterEnabled: false,
  });

  return (
    <div className="min-w-0 select-none" style={accentStyle}>
      {!hideLabel && (
        <span
          data-custom-select-label
          className={`mb-1.5 block text-left text-[10px] font-bold uppercase tracking-wide text-slate-400 ${labelClassName ?? ""}`}
        >
          {label}
          {showRequirement && (
            <span
              className="ms-1 font-bold normal-case"
              style={{ color: "var(--theme-primary, #64748b)" }}
            >
              {required ? "*" : "(ئارەزوومەندانە)"}
            </span>
          )}
        </span>
      )}
      <button
        data-custom-select-trigger
        ref={triggerRef}
        type="button"
        disabled={disabled || !hasOptions}
        onClick={() => {
          if (!hasOptions) return;
          if (!isOpen) {
            setPortalContainer(portalContainerRef?.current ?? triggerRef.current?.ownerDocument.body ?? null);
            triggerRef.current?.focus({ preventScroll: true });
            setSearchQuery("");
            setInitialFocusValue(null);
            typeahead.current = { text: "", time: 0 };
            updateMenuPosition();
          }
          setIsOpen((current) => !current);
        }}
        className={`${SHARED_SOFT_BUTTON_CLASS} ${styles.trigger} flex h-10 ${fullWidth ? "w-full" : "w-fit"} items-center justify-between gap-2 rounded-lg px-3 text-left text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${triggerClassName ?? ""}`}
        role={ariaInvalid !== undefined ? "combobox" : undefined}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid || undefined}
        onKeyDown={(event) => {
          if (event.ctrlKey || event.metaKey || event.altKey || event.nativeEvent.isComposing) return;
          if (!searchable && event.key.length === 1 && event.key !== " ") {
            const match = findTypedOption(event.key, !isOpen);
            if (!match) return;
            event.preventDefault();
            setInitialFocusValue(match.value);
            if (!isOpen) updateMenuPosition();
            setIsOpen(true);
            if (isOpen) {
              const target = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=option]") ?? [])
                .find((option) => option.getAttribute("data-option-value") === match.value);
              target?.focus({ preventScroll: true });
              target?.scrollIntoView?.({ block: "nearest" });
            }
            return;
          }
          if (
            event.key === "ArrowDown" ||
            event.key === "ArrowUp" ||
            (searchable && event.key.length === 1)
          ) {
            event.preventDefault();
            setSearchQuery(event.key.length === 1 ? event.key : "");
            if (!isOpen) {
              setInitialFocusValue(null);
              typeahead.current = { text: "", time: 0 };
              updateMenuPosition();
            }
            setIsOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {triggerLabel ?? selected?.label ?? emptyLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {hasOptions &&
        isOpen &&
        menuPosition &&
        createPortal(
          <div className={portalDark ? "dark" : "light"}>
            <div
              id={menuId}
              data-picker-surface
              data-appearance={portalDark ? "dark" : "light"}
              ref={menuRef}
              className={`${styles.menuShell} ${surfaceStyles.surface} custom-scrollbar theme-custom-scrollbar fixed z-[150] select-none border ${menuTitle ? styles.pickerShell : ""} ${menuLayout === "grid" ? styles.gridShell : "overflow-y-auto overscroll-contain p-1"} ${searchable && menuLayout === "list" ? styles.searchableShell : ""} ${inheritAppearance ? styles.isolatedMenu : ""}`}
              data-placement={
                menuPosition.bottom !== undefined ? "top" : "bottom"
              }
              style={{
                ...menuPosition,
                maxHeight:
                  menuLayout === "grid" ? undefined : menuPosition.maxHeight,
                ...portalThemeStyle,
                ...accentStyle,
              }}
              role="listbox"
              tabIndex={-1}
              aria-label={label}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsOpen(false);
                  triggerRef.current?.focus({ preventScroll: true });
                  return;
                }
                const items = Array.from(
                  menuRef.current?.querySelectorAll<HTMLButtonElement>(
                    "[role=option]:not(:disabled)",
                  ) ?? [],
                );
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  const position = items.indexOf(
                    event.currentTarget.ownerDocument.activeElement as HTMLButtonElement,
                  );
                  const next =
                    position < 0
                      ? event.key === "ArrowDown"
                        ? 0
                        : items.length - 1
                      : (position +
                          (event.key === "ArrowDown" ? 1 : -1) +
                          items.length) %
                        items.length;
                  items[next]?.focus({ preventScroll: true });
                  items[next]?.scrollIntoView?.({ block: "nearest" });
                } else if (
                  !searchable && event.key.length === 1 && event.key !== " " &&
                  !event.ctrlKey && !event.metaKey && !event.altKey && !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  const match = findTypedOption(event.key);
                  const target = items.find((option) => option.getAttribute("data-option-value") === match?.value);
                  target?.focus({ preventScroll: true });
                  target?.scrollIntoView?.({ block: "nearest" });
                } else if (
                  searchable &&
                  event.key === "Enter" &&
                  event.target === searchRef.current
                ) {
                  event.preventDefault();
                  event.stopPropagation();
                  items[0]?.click();
                } else if (
                  searchable &&
                  event.target !== searchRef.current &&
                  !event.ctrlKey &&
                  !event.metaKey &&
                  !event.altKey &&
                  (event.key.length === 1 || event.key === "Backspace")
                ) {
                  event.preventDefault();
                  setSearchQuery((current) =>
                    event.key === "Backspace"
                      ? current.slice(0, -1)
                      : current + event.key,
                  );
                  searchRef.current?.focus({ preventScroll: true });
                }
              }}
              dir="ltr"
            >
              {(menuTitle || searchable) && (
                <div className={styles.menuToolbar}>
                  {menuTitle && <PickerPopupHeader title={menuTitle} closeLabel={closeLabel} onClose={() => {
                    setIsOpen(false);
                    triggerRef.current?.focus({ preventScroll: true });
                  }} />}
                  {searchable && <div className={styles.searchRow}>
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <input
                    data-custom-select-search
                    ref={searchRef}
                    type="search"
                    aria-label={searchPlaceholder}
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className={`${SHARED_CONTROL_CLASS} ${SHARED_INSET_CONTROL_CLASS} ${styles.searchInput}`}
                  />
                  </div>}
                </div>
              )}
              {!displayedOptions.length && (
                <p role="status" className="px-3 py-4 text-xs opacity-70">
                  {emptyLabel}
                </p>
              )}
              <div
                className={menuLayout === "grid" ? styles.gridMenu : `${styles.listMenu} custom-scrollbar theme-custom-scrollbar`}
                style={
                  menuLayout === "grid"
                    ? { maxHeight: menuPosition.maxHeight }
                    : undefined
                }
              >
                {displayedOptions.map((option, index) => (
                  <Fragment key={option.value}>
                    {option.group &&
                      option.group !== displayedOptions[index - 1]?.group && (
                        <div
                          role="presentation"
                          className="px-3 pb-1 pt-2 text-[10px] font-bold text-slate-400"
                        >
                          {option.group}
                        </div>
                      )}
                    <button
                      ref={
                        option ===
                        (displayedOptions.find((item) => !item.disabled && item.value === initialFocusValue) ?? displayedOptions.find((item) => !item.disabled))
                          ? firstOptionRef
                          : undefined
                      }
                      type="button"
                      role="option"
                      data-option-value={option.value}
                      aria-selected={option.value === value}
                      disabled={option.disabled}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchQuery("");
                        if (menuLayout === "grid" || searchable)
                          triggerRef.current?.focus({ preventScroll: true });
                      }}
                      className={`${styles.option} ${menuLayout === "grid" ? styles.gridOption : "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs"} transition disabled:opacity-40 ${
                        option.value === value
                          ? menuLayout === "grid"
                            ? "theme-fill font-bold text-[var(--theme-ink)]"
                            : `${styles.selectedOption} font-semibold`
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {menuLayout === "grid" && option.icon && (
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                          <option.icon
                            aria-hidden
                            className="size-6"
                            strokeWidth={1.5}
                          />
                        </span>
                      )}
                      <span>{option.label}</span>
                      {option.value === value && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>,
          portalContainer ?? document.body,
        )}
    </div>
  );
}
