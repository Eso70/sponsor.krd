"use client";

import { IconActionButton } from "@/components/shared/IconActionButton";
import {
  getPlatformBrand,
  platformAccentColor,
} from "@/lib/brand/platform-brands";
import {
  formWhatsAppCopy,
  submissionWhatsAppDraft,
} from "../form-submission-whatsapp";
import type { FormLanguage, FormSubmission } from "../types";
import type { FormWhatsAppDetailsConfig } from "@linktree/types";

const WhatsAppIcon = getPlatformBrand("whatsapp").icon;

export function FormSubmissionWhatsAppAction({
  response,
  locale,
  template,
  detailsConfig,
}: {
  response: FormSubmission;
  locale: FormLanguage;
  template?: string;
  detailsConfig?: FormWhatsAppDetailsConfig;
}) {
  const draft = submissionWhatsAppDraft(
    response,
    locale,
    template,
    detailsConfig,
  );
  const copy = formWhatsAppCopy(locale);
  return (
    <IconActionButton
      onClick={() => {
        if (draft) window.open(draft.href, "_blank", "noopener,noreferrer");
      }}
      disabled={!draft}
      label={draft ? `${copy.open} · ${draft.phone}` : copy.unavailable}
    >
      <WhatsAppIcon
        aria-hidden
        className="size-4"
        style={{ color: platformAccentColor("whatsapp") }}
      />
    </IconActionButton>
  );
}
