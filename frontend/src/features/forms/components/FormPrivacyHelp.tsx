import { CircleHelp } from "lucide-react";
import { HoverPopover } from "@/components/shared/HoverPopover";
import { formEditorCopy } from "../form-editor-copy";
import type { FormLanguage } from "../types";
import { FormPolicyLinks } from "./FormPolicyLinks";

export function FormPrivacyHelp({
  language,
  publicPage = false,
}: {
  language: FormLanguage;
  publicPage?: boolean;
}) {
  const labels = formEditorCopy(language);
  return (
    <HoverPopover
      label={labels.privacyHelp}
      trigger={<CircleHelp aria-hidden className="size-4" />}
      panelStyle={{
        background: "var(--preview-surface)",
        color: "var(--preview-text)",
        borderColor: "var(--preview-border)",
      }}
    >
      <p>{publicPage ? labels.privacyPublicSummary : labels.privacySummary}</p>
      <FormPolicyLinks language={language} />
    </HoverPopover>
  );
}
