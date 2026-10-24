import { SHARED_CONTROL_CLASS, SHARED_CONTROL_ERROR_CLASS } from "./shared-control-styles";

export const modalInputBase =
  "modal-standard-input w-full rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm placeholder:font-normal disabled:cursor-not-allowed disabled:opacity-50";

export const modalInputNormal =
  SHARED_CONTROL_CLASS;

export const modalInputError =
  `${SHARED_CONTROL_CLASS} ${SHARED_CONTROL_ERROR_CLASS} modal-standard-input-error`;

export function modalInputClass(hasError?: boolean, extra = "") {
  return `${modalInputBase} ${hasError ? modalInputError : modalInputNormal} ${extra}`.trim();
}

export function modalTextareaClass(hasError?: boolean, extra = "") {
  return `${modalInputClass(hasError, extra)} resize-y`.trim();
}

export function modalChoiceButtonClass(hasError?: boolean, extra = "") {
  return `${modalInputBase} relative text-left flex items-center justify-between gap-2 ${
    hasError ? modalInputError : modalInputNormal
  } ${extra}`.trim();
}
