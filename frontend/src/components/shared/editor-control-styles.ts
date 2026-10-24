import { modalInputClass, modalTextareaClass } from "./modal-input-styles";
import { SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";

/** Compact authoring controls shared by Forms and Linktree. */
export const EDITOR_INPUT_CLASS = "!h-10 !rounded-xl !px-3 !py-2 !text-sm";
export const EDITOR_TEXTAREA_CLASS = "!min-h-20 !rounded-xl !px-3 !py-2 !text-sm";
export const EDITOR_FIELD_CLASS = "[&>span:first-child]:text-[13px] [&>span:first-child]:mb-2";
export const EDITOR_IMAGE_ACTION_CLASS = `${SHARED_SOFT_BUTTON_CLASS} flex items-center gap-1.5 px-2 py-1 text-xs font-semibold disabled:opacity-40`;
export const EDITOR_CARD_CLASS = "rounded-2xl border border-slate-200/50 bg-slate-50/50 dark:border-white/[0.06] dark:bg-white/[0.02]";

export function editorInputClass(hasError = false, extra = "") {
  return modalInputClass(hasError, `${EDITOR_INPUT_CLASS} ${extra}`);
}
export function editorTextareaClass(hasError = false, extra = "") {
  return modalTextareaClass(hasError, `${EDITOR_TEXTAREA_CLASS} ${extra}`);
}
