"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Pipette } from "lucide-react";
import { useAnchoredPopup } from "@/hooks/useAnchoredPopup";
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
import { RAINBOW_BACKGROUND_COLORS } from "@/lib/utils/color-palettes";
import { normalizeHex } from "@/lib/utils/color-conversion";
import { ColorChannelsEditor } from "./ColorChannelsEditor";
import { ColorSwatch } from "./ColorSwatch";
import styles from "./ColorGradientModal.module.css";
import surfaceStyles from "./picker-popup-surface.module.css";
import { PickerPopupHeader } from "./PickerPopupHeader";
import { pickerAppearance } from "@/lib/utils/picker-appearance";
import { SHARED_CONTROL_CLASS } from "./shared-control-styles";
import { Tooltip } from "@/components/shared/Tooltip";
import {
  parseWebsiteColor,
  WEBSITE_GRADIENT_DIRECTIONS,
  type WebsiteGradientDirection,
} from "@/lib/utils/parse-website-color";

type ColorMode = "hex" | "rgb" | "hsl";
type ActiveColor = "from" | "to";

export interface ColorGradientModalProps {
  /** Optional image tab for page backgrounds; other color-only pickers stay unchanged. */
  imageTab?: { label: string; content: ReactNode; selected?: boolean };
  /** Anchors the same picker as a compact popup, without a backdrop. */
  anchorRef?: RefObject<HTMLElement | null>;
  isOpen: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  solidFallback?: string;
  gradientFallback?: string;
  title?: string;
  subtitle?: string;
  allowGradient?: boolean;
  copy?: Partial<
    Record<
      | "title"
      | "subtitle"
      | "unsupported"
      | "picked"
      | "pickFailed"
      | "solid"
      | "gradient"
      | "first"
      | "second"
      | "color"
      | "eyedropper"
      | "pick"
      | "direction"
      | "leftRight"
      | "rightLeft"
      | "topBottom"
      | "bottomTop"
      | "diagonal"
      | "diagonalReverse"
      | "topRight"
      | "topLeft"
      | "radial"
      | "quickColors"
      | "pickedColors"
      | "apply"
      | "close"
      | "red"
      | "green"
      | "blue"
      | "hue"
      | "saturation"
      | "lightness",
      string
    >
  >;
}

declare global {
  interface Window {
    EyeDropper?: new () => {
      open: () => Promise<{ sRGBHex: string }>;
    };
  }
}

// Match the Linktree editor's first-step background palette; retain pure black.
const QUICK_COLORS = [
  ...RAINBOW_BACKGROUND_COLORS.filter((color) => color.id !== "black").map(
    (color) => color.value,
  ),
  "#000000",
];

function isHex(value: string) {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

function parseColorValue(
  value: string,
  solidFallback: string,
  gradientFallback: string,
) {
  if (value.startsWith("gradient:")) {
    const [, direction, from, to] = value.split(":");
    return {
      mode: "gradient" as const,
      direction: (WEBSITE_GRADIENT_DIRECTIONS.includes(
        direction as WebsiteGradientDirection,
      )
        ? direction
        : "to-b") as WebsiteGradientDirection,
      from: normalizeHex(from || solidFallback, solidFallback),
      to: normalizeHex(to || gradientFallback, gradientFallback),
    };
  }

  const solid = normalizeHex(value, solidFallback);
  return {
    mode: "solid" as const,
    direction: "to-b" as WebsiteGradientDirection,
    from: solid,
    to: solid,
  };
}

function getPreviewStyle(
  from: string,
  to: string,
  direction: WebsiteGradientDirection,
) {
  if (from === to) return { background: from };
  return {
    background: parseWebsiteColor(`gradient:${direction}:${from}:${to}`).css,
  };
}

export function ColorGradientModal({
  isOpen,
  anchorRef,
  value,
  onChange,
  onClose,
  solidFallback = "#000000",
  gradientFallback = "#0066ff",
  title,
  subtitle,
  allowGradient = true,
  copy,
  imageTab,
}: ColorGradientModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const modalTitle = title ?? copy?.title ?? "ڕەنگی ئارەزوومەندانەیە";
  const modalSubtitle =
    subtitle ?? copy?.subtitle ?? "ڕەنگی تاک یان گرادیێنت دروست بکە";
  const [portalDocument, setPortalDocument] = useState<Document | null>(null);
  const [mounted, setMounted] = useState(false);
  const [appearance, setAppearance] = useState<"light" | "dark">("light");
  const parsedInitial = useMemo(
    () => parseColorValue(value, solidFallback, gradientFallback),
    [value, solidFallback, gradientFallback],
  );
  const [isGradient, setIsGradient] = useState(
    allowGradient && parsedInitial.mode === "gradient",
  );
  const [from, setFrom] = useState(parsedInitial.from);
  const [to, setTo] = useState(parsedInitial.to);
  const [direction, setDirection] = useState<WebsiteGradientDirection>(
    parsedInitial.direction,
  );
  const [activeColor, setActiveColor] = useState<ActiveColor>("from");
  const [inputMode, setInputMode] = useState<ColorMode>("hex");
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [pickerMessage, setPickerMessage] = useState<string | null>(null);
  const [pickedColors, setPickedColors] = useState<string[]>([]);
  const [imageTabActive, setImageTabActive] = useState(!!imageTab?.selected);
  /**
   * What the hex field currently shows while it is being typed into.
   *
   * The committed colour is always a complete hex, but the strings on the way
   * there ("#", "#00", "") are not. Committing on every keystroke meant each one
   * failed to parse and snapped the field back to the old colour, so the value
   * could only ever be replaced in a single paste — typing a new colour was
   * impossible. `null` means "show the committed colour".
   */
  const [hexDraft, setHexDraft] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      setPortalDocument(anchorRef?.current?.ownerDocument ?? document);
      setAppearance(pickerAppearance(anchorRef?.current ?? document.documentElement));
      const parsed = parseColorValue(value, solidFallback, gradientFallback);
      setIsGradient(allowGradient && parsed.mode === "gradient");
      setFrom(parsed.from);
      setTo(parsed.to);
      setDirection(parsed.direction);
      setActiveColor("from");
      setInputMode("hex");
      setPickerMessage(null);
      setHexDraft(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, value, solidFallback, gradientFallback, allowGradient, anchorRef]);

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => setImageTabActive(!!imageTab?.selected));
    return () => cancelAnimationFrame(frame);
  }, [isOpen, imageTab?.selected]);

  const popupStyle = useAnchoredPopup({ isOpen: isOpen && mounted && portalDocument !== null, anchorRef, popupRef: dialogRef, onClose, align: "end" });

  const activeValue = activeColor === "from" ? from : to;
  const setActiveValue = (nextValue: string) => {
    const nextHex = normalizeHex(nextValue, activeValue);
    if (activeColor === "from") {
      setFrom(nextHex);
      if (!isGradient) setTo(nextHex);
    } else {
      setTo(nextHex);
    }
  };

  /** Switch which colour the fields edit, discarding a half-typed hex. */
  const selectActiveColor = (next: ActiveColor) => {
    setHexDraft(null);
    setActiveColor(next);
  };

  const pickScreenColor = async () => {
    setPickerMessage(null);

    if (
      typeof window === "undefined" ||
      typeof window.EyeDropper !== "function"
    ) {
      setPickerMessage(
        copy?.unsupported ?? "ئەم وێبگەڕە پشتگیری پێنووسی ڕەنگ ناکات.",
      );
      return;
    }

    setIsPickingColor(true);
    try {
      const result = await new window.EyeDropper().open();
      const pickedColor = normalizeHex(result.sRGBHex, activeValue);
      setHexDraft(null);
      setActiveValue(pickedColor);
      setPickedColors((previous) =>
        [
          pickedColor,
          ...previous.filter((color) => color !== pickedColor),
        ].slice(0, 8),
      );
      setPickerMessage(copy?.picked ?? "ڕەنگەکە وەرگیرا.");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name !== "AbortError") {
        setPickerMessage(
          copy?.pickFailed ??
          "نەتوانرا ڕەنگەکە وەربگیرێت. تکایە دووبارە هەوڵبدەوە.",
        );
      }
    } finally {
      setIsPickingColor(false);
    }
  };

  const applyColor = () => {
    if (imageTabActive && imageTab) {
      onClose();
      return;
    }
    if (!allowGradient || !isGradient) {
      onChange(from);
    } else {
      onChange(`gradient:${direction}:${from}:${to}`);
    }
    onClose();
  };

  useModalKeyboard({
    isOpen: isOpen && mounted && portalDocument !== null,
    onEscape: onClose,
    onEnter: applyColor,
    enterEnabled: !imageTabActive,
    dialogRef,
  });

  if (!isOpen || !mounted || !portalDocument) return null;

  return createPortal(
    <div className={appearance}>
      {!anchorRef && (
        <div
          className={`fixed inset-0 z-[200] bg-black/30 backdrop-blur-lg   duration-300 transition-opacity ${isPickingColor ? "opacity-0 pointer-events-none" : "opacity-100"}`}
          onClick={onClose}
          aria-hidden
        />
      )}

      <div
        ref={dialogRef}
        data-picker-surface
        data-appearance={appearance}
        role="dialog"
        aria-modal={!anchorRef}
        aria-labelledby={titleId}
        tabIndex={-1}
        style={anchorRef ? popupStyle : undefined}
        className={`${surfaceStyles.surface} ${styles.panel} modal-ltr fixed z-[201] flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100/50 shadow-2xl transition-opacity duration-200 ${anchorRef ? styles.popup : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:w-[85vw] md:w-[75vw] max-w-md max-h-[92svh] sm:max-h-[85vh]"} ${isPickingColor ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        dir="ltr"
      >
        <PickerPopupHeader title={modalTitle} titleId={titleId}
          subtitle={anchorRef ? undefined : modalSubtitle}
          closeLabel={copy?.close ?? "داخستن"} onClose={onClose} />

        {/* Flexes between the header and footer instead of subtracting a fixed
            130px, which overflowed once mobile browser chrome ate the viewport. */}
        <div
          className={`${styles.body} min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-2.5`}
        >
          {(allowGradient || imageTab) && (
            <div className={styles.group}>
              <button
                type="button"
                onClick={() => {
                  setImageTabActive(false);
                  setIsGradient(false);
                  setTo(from);
                  selectActiveColor("from");
                }}
                className={`flex-1 py-3 sm:py-2 text-xs font-medium transition-all ${!isGradient && !imageTabActive ? `${surfaceStyles.selected}` : `${surfaceStyles.control}`}`}
              >
                {copy?.solid ?? "ڕەنگی تاک"}
              </button>
              {allowGradient && <button
                type="button"
                onClick={() => {
                  setImageTabActive(false);
                  setIsGradient(true);
                  if (from === to) setTo(gradientFallback);
                }}
                className={`flex-1 py-3 sm:py-2 text-xs font-medium transition-all ${isGradient && !imageTabActive ? `${surfaceStyles.selected}` : `${surfaceStyles.control}`}`}
              >
                {copy?.gradient ?? "گرادیێنت"}
              </button>}
              {imageTab && <button type="button" onClick={() => setImageTabActive(true)}
                className={`flex-1 py-3 sm:py-2 text-xs font-medium transition-all ${imageTabActive ? `${surfaceStyles.selected}` : `${surfaceStyles.control}`}`}>
                {imageTab.label}
              </button>}
            </div>
          )}

          {imageTabActive && imageTab ? imageTab.content : <>
            <div
              data-color-preview
              className={`${styles.sample} ${styles.preview} h-14 w-full rounded-xl border border-gray-200`}
              style={
                {
                  "--picker-color": getPreviewStyle(
                    from,
                    isGradient ? to : from,
                    direction,
                  ).background,
                } as CSSProperties
              }
            />

            {isGradient && (
              <div className={styles.group}>
                {(
                  [
                    ["from", copy?.first ?? "ڕەنگی یەکەم"],
                    ["to", copy?.second ?? "ڕەنگی دووەم"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={activeColor === id}
                    onClick={() => selectActiveColor(id)}
                    className={`flex-1 py-2.5 sm:py-1.5 rounded-md text-xs sm:text-[11px] font-semibold transition-all ${activeColor === id ? `${surfaceStyles.selected}` : `${surfaceStyles.control}`}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className={styles.group}>
              {(["hex", "rgb", "hsl"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={inputMode === mode}
                  onClick={() => setInputMode(mode)}
                  className={`flex-1 py-2.5 sm:py-1.5 rounded-md text-xs sm:text-[10px] font-semibold uppercase transition-all ${inputMode === mode ? `${surfaceStyles.selected}` : `${surfaceStyles.control}`}`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">
                {isGradient
                  ? activeColor === "from"
                    ? (copy?.first ?? "ڕەنگی یەکەم")
                    : (copy?.second ?? "ڕەنگی دووەم")
                  : (copy?.color ?? "ڕەنگ")}
              </label>
              <div className={styles.fieldRow}>
                <span
                  className={`${styles.sample} h-9 w-10 shrink-0 rounded-lg border border-gray-200`}
                  style={{ "--picker-color": activeValue } as CSSProperties}
                  aria-hidden
                />
                <input
                  type="text"
                  aria-label={
                    isGradient
                      ? activeColor === "from"
                        ? (copy?.first ?? "ڕەنگی یەکەم")
                        : (copy?.second ?? "ڕەنگی دووەم")
                      : (copy?.color ?? "ڕەنگ")
                  }
                  value={hexDraft ?? activeValue}
                  onChange={(event) => {
                    const raw = event.target.value;
                    setHexDraft(raw);
                    // Commit as soon as the draft is a whole colour, so the
                    // preview tracks typing without the field ever fighting it.
                    // Expanded to six digits on the way in: `#abc` is a colour a
                    // person may reasonably type, while public-page and
                    // onboarding validators accept `#rrggbb` only, so committing
                    // it verbatim saved a value the API answered with a 400.
                    // Every other source here — presets, RGB/HSL, the eyedropper,
                    // the stored value — is already six digits.
                    if (isHex(raw))
                      setActiveValue(normalizeHex(raw, activeValue));
                  }}
                  onBlur={() => setHexDraft(null)}
                  data-picker-field
                  className={`${SHARED_CONTROL_CLASS} ${surfaceStyles.field} min-w-0 flex-1 px-2 font-mono text-xs`}
                  placeholder={copy?.color ?? "ڕەنگ"}
                  inputMode="text"
                  maxLength={7}
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <Tooltip content={copy?.eyedropper ?? "پێنووسی ڕەنگ"} side="top">
                  <button
                    type="button"
                    onClick={pickScreenColor}
                    disabled={isPickingColor}
                    className={`${surfaceStyles.control} flex h-10 shrink-0 items-center justify-center gap-1.5 px-2 text-xs font-semibold disabled:cursor-wait disabled:opacity-70`}
                    aria-label={copy?.eyedropper ?? "پێنووسی ڕەنگ"}
                  >
                    <Pipette className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {isPickingColor ? "..." : (copy?.pick ?? "پێنووس")}
                    </span>
                  </button>
                </Tooltip>
              </div>
              {pickerMessage && (
                <p className="text-[11px] text-gray-500">{pickerMessage}</p>
              )}

              {inputMode !== "hex" && (
                <ColorChannelsEditor
                  key={`${activeColor}:${inputMode}`}
                  mode={inputMode}
                  value={activeValue}
                  onChange={(color) => {
                    setHexDraft(null);
                    setActiveValue(color);
                  }}
                  labels={{
                    red: copy?.red ?? "سوور",
                    green: copy?.green ?? "سەوز",
                    blue: copy?.blue ?? "شین",
                    hue: copy?.hue ?? "تۆنی ڕەنگ",
                    saturation: copy?.saturation ?? "تێری ڕەنگ",
                    lightness: copy?.lightness ?? "ڕووناکی",
                  }}
                />
              )}
            </div>

            {isGradient && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">
                  {copy?.direction ?? "ئاراستەی گرادیێنت"}
                </label>
                <div className={`${styles.directions} grid grid-cols-5 gap-1.5`}>
                  {[
                    {
                      id: "to-r",
                      label: "→",
                      title: copy?.leftRight ?? "چەپ بۆ ڕاست",
                    },
                    {
                      id: "to-l",
                      label: "←",
                      title: copy?.rightLeft ?? "ڕاست بۆ چەپ",
                    },
                    {
                      id: "to-b",
                      label: "↓",
                      title: copy?.topBottom ?? "سەرەوە بۆ خوارەوە",
                    },
                    {
                      id: "to-t",
                      label: "↑",
                      title: copy?.bottomTop ?? "خوارەوە بۆ سەرەوە",
                    },
                    {
                      id: "to-br",
                      label: "↘",
                      title: copy?.diagonal ?? "لاتەنیشت",
                    },
                    {
                      id: "to-bl",
                      label: "↙",
                      title: copy?.diagonalReverse ?? "لاتەنیشت پێچەوانە",
                    },
                    {
                      id: "to-tr",
                      label: "↗",
                      title: copy?.topRight ?? "بۆ سەرەوەی ڕاست",
                    },
                    {
                      id: "to-tl",
                      label: "↖",
                      title: copy?.topLeft ?? "بۆ سەرەوەی چەپ",
                    },
                    {
                      id: "radial",
                      label: "◎",
                      title: copy?.radial ?? "بازنەیی",
                    },
                  ].map((item) => (
                    <Tooltip key={item.id} content={item.title} side="top">
                      <button
                        type="button"
                        aria-label={item.title}
                        title={item.title}
                        aria-pressed={direction === item.id}
                        onClick={() =>
                          setDirection(item.id as WebsiteGradientDirection)
                        }
                        className={`h-11 sm:h-9 w-full rounded-xl text-base sm:text-sm font-medium border transition-all cursor-pointer ${direction === item.id ? `${surfaceStyles.selected}` : `${surfaceStyles.control}`}`}
                      >
                        {item.label}
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">
                {copy?.quickColors ?? "ڕەنگی ئامادە"}
              </label>
              <div className={styles.palette}>
                {QUICK_COLORS.map((color) => (
                  <ColorSwatch
                    key={color}
                    color={color}
                    selected={activeValue === color}
                    onSelect={() => {
                      setHexDraft(null);
                      setActiveValue(color);
                    }}
                  />
                ))}
              </div>
            </div>

            {pickedColors.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">
                  {copy?.pickedColors ?? "ڕەنگە وەرگیراوەکان"}
                </label>
                <div className={styles.palette}>
                  {pickedColors.map((color) => (
                    <ColorSwatch
                      key={color}
                      color={color}
                      selected={activeValue === color}
                      onSelect={() => {
                        setHexDraft(null);
                        setActiveValue(color);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            onClick={applyColor}
            className={`theme-fill ${surfaceStyles.primary} h-9 rounded-lg px-4 text-xs font-semibold transition-opacity hover:opacity-90`}
          >
            {copy?.apply ?? "جێبەجێکردن"}
          </button>
        </div>
      </div>
    </div>,
    portalDocument.body,
  );
}
