"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import styles from "./CustomSelect.module.css";
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
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
  const searchRef = useRef<HTMLInputElement>(null);
  const firstOptionRef = useRef<HTMLButtonElement>(null);
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
    const rect = trigger.getBoundingClientRect();

    // The menu is portaled to <body>, so explicitly carry the effective theme
    // variables across that boundary instead of falling back to a solid color.
    const computedStyle = window.getComputedStyle(trigger);
    const appearance = trigger.closest(".dark, .light");
    setPortalDark(
      appearance
        ? appearance.classList.contains("dark")
        : computedStyle.colorScheme === "dark",
    );
    const inheritedTheme = [
      "--theme-primary",
      "--theme-css",
      "--theme-ink",
      "--theme-text-primary",
      "--sponsor-krd-accent",
      "--sponsor-krd-accent-gradient",
      "--sponsor-krd-accent-ink",
    ].reduce<Record<string, string>>((variables, property) => {
      const propertyValue = computedStyle.getPropertyValue(property).trim();
      if (propertyValue) variables[property] = propertyValue;
      return variables;
    }, {});
    if (inheritAppearance) {
      Object.assign(inheritedTheme, {
        "--select-surface": computedStyle.backgroundColor,
        "--select-font-size": computedStyle.fontSize,
        "--select-option-height": `${Math.min(44, Math.max(36, rect.height))}px`,
        "--select-text": computedStyle.color,
        "--select-border":
          computedStyle.getPropertyValue("--preview-border").trim() ||
          (computedStyle.colorScheme === "dark" ? "#475569" : "#e2e8f0"),
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
        ? Math.ceil(options.length / (window.innerWidth < 480 ? 2 : 4)) * 108 +
            16
        : options.length * optionHeight + 8,
    );
    const shouldOpenUp =
      placement === "top" ||
      (window.innerHeight - rect.bottom < estimatedMenuHeight + gap &&
        rect.top > estimatedMenuHeight + gap);
    const width = Math.min(
      Math.max(rect.width, minMenuWidth),
      window.innerWidth - 16,
    );

    setMenuPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      width,
      maxHeight: Math.max(
        32,
        Math.min(
          maxMenuHeight,
          (shouldOpenUp ? rect.top : window.innerHeight - rect.bottom) -
            gap -
            8,
        ),
      ),
      ...(shouldOpenUp
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
    });
  }, [
    options.length,
    placement,
    maxMenuHeight,
    minMenuWidth,
    menuLayout,
    inheritAppearance,
  ]);

  useEffect(() => {
    if (!isOpen) return;

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
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
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
            triggerRef.current?.focus({ preventScroll: true });
            setSearchQuery("");
            updateMenuPosition();
          }
          setIsOpen((current) => !current);
        }}
        className={`${styles.trigger} flex h-10 ${fullWidth ? "w-full" : "w-fit"} items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-xs font-semibold text-slate-600 outline-none transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 ${triggerClassName ?? ""}`}
        role={ariaInvalid !== undefined ? "combobox" : undefined}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid || undefined}
        onKeyDown={(event) => {
          if (event.ctrlKey || event.metaKey || event.altKey) return;
          if (
            event.key === "ArrowDown" ||
            event.key === "ArrowUp" ||
            (searchable && event.key.length === 1)
          ) {
            event.preventDefault();
            setSearchQuery(event.key.length === 1 ? event.key : "");
            if (!isOpen) updateMenuPosition();
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
              ref={menuRef}
              className={`${styles.menuShell} custom-scrollbar theme-custom-scrollbar fixed z-[150] select-none rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#1c222b] ${menuLayout === "grid" ? styles.gridShell : "overflow-y-auto overscroll-contain p-1"} ${inheritAppearance ? styles.isolatedMenu : ""}`}
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
                    document.activeElement as HTMLButtonElement,
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
              {searchable && (
                <div className={styles.searchRow}>
                  <input
                    data-custom-select-search
                    ref={searchRef}
                    type="search"
                    aria-label={searchPlaceholder}
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className={styles.searchInput}
                  />
                </div>
              )}
              {!displayedOptions.length && (
                <p role="status" className="px-3 py-4 text-xs opacity-70">
                  {emptyLabel}
                </p>
              )}
              <div
                className={menuLayout === "grid" ? styles.gridMenu : undefined}
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
                        displayedOptions.find((item) => !item.disabled)
                          ? firstOptionRef
                          : undefined
                      }
                      type="button"
                      role="option"
                      aria-selected={option.value === value}
                      disabled={option.disabled}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchQuery("");
                        if (menuLayout === "grid" || searchable)
                          triggerRef.current?.focus({ preventScroll: true });
                      }}
                      className={`${styles.option} ${menuLayout === "grid" ? styles.gridOption : "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs"} transition disabled:opacity-40 ${
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
          document.body,
        )}
    </div>
  );
}
