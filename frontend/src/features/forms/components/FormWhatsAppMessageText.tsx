import { Fragment } from "react";
import { parseWhatsAppTextTable } from "../form-whatsapp-text-table";
import { FormWhatsAppProductTable } from "./FormWhatsAppProductTable";

/** Fit generated product columns to the preview; never interpret message HTML. */
export function FormWhatsAppMessageText({ text }: { text: string }) {
  const parts: { text: string; code: boolean }[] = [];
  let position = 0;
  for (const match of text.matchAll(/```([\s\S]*?)```/g)) {
    if (match.index > position)
      parts.push({ text: text.slice(position, match.index), code: false });
    parts.push({ text: match[1], code: true });
    position = match.index + match[0].length;
  }
  if (position < text.length)
    parts.push({ text: text.slice(position), code: false });
  return (
    <>
      {parts.map((part, index) => {
        const table = part.code ? parseWhatsAppTextTable(part.text) : null;
        return table ? (
          <FormWhatsAppProductTable key={index} {...table} />
        ) : part.code ? (
          <pre
            key={index}
            dir="ltr"
            className="my-2 overflow-x-auto rounded-lg bg-slate-100 px-3 font-mono text-xs leading-5 dark:bg-white/5"
          >
            <code>{part.text}</code>
          </pre>
        ) : (
          <Fragment key={index}>
            <span dir="auto" className="whitespace-pre-wrap">
              {part.text}
            </span>
          </Fragment>
        );
      })}
    </>
  );
}
