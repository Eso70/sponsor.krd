import {
  SHARED_ACTION_CLASS,
  SHARED_CONTROL_CLASS,
} from "./shared-control-styles";

/** Auth screens share the same soft inputs and action geometry as dashboards. */
export const AUTHENTICATION_CODE_INPUT_CLASS = `${SHARED_CONTROL_CLASS} h-12 w-full px-4 text-center text-lg font-black tracking-[0.45em] disabled:opacity-50`;
export const AUTHENTICATION_SUBMIT_BUTTON_CLASS = `${SHARED_ACTION_CLASS} theme-fill flex h-12 w-full items-center justify-center gap-2 px-4 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50`;
