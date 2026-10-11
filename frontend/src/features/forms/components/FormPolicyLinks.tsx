import { getPlatformLegalUrl } from "@/lib/utils/app-url";
import { formEditorCopy } from "../form-editor-copy";
import { formsCopy } from "../forms-copy";
import type { FormLanguage } from "../types";

/** Legal destinations always belong to the platform, including on custom domains. */
export function FormPolicyLinks({ language }: { language: FormLanguage }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
      {(["privacy", "terms"] as const).map((kind) => (
        <a
          key={kind}
          href={getPlatformLegalUrl(kind, language)}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          {kind === "privacy"
            ? formsCopy(language).policy
            : formEditorCopy(language).terms}
        </a>
      ))}
    </div>
  );
}
