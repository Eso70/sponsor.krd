import type { Ref, TextareaHTMLAttributes } from "react";
import { TEXTAREA_LIMIT } from "./input-limits";
import { modalInputClass } from "./modal-input-styles";

export function ModalTextArea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: Ref<HTMLTextAreaElement>;
}) {
  return (
    <textarea
      {...props}
      maxLength={props.maxLength ?? TEXTAREA_LIMIT}
      className={modalInputClass(false, `min-h-24 resize-y py-3 ${className}`)}
    />
  );
}
