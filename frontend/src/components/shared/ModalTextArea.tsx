import type { TextareaHTMLAttributes } from "react";
import { modalInputClass } from "./modal-input-styles";

export function ModalTextArea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={modalInputClass(false, `min-h-24 resize-y py-3 ${className}`)}
    />
  );
}
