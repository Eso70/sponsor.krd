"use client";

import { CustomSelect } from "@/components/shared/CustomSelect";
import { EditorField } from "@/components/shared/EditorField";
import { editorInputClass, EDITOR_FIELD_CLASS } from "@/components/shared/editor-control-styles";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { SponsorPhoneDestination } from "./SponsorPhoneDestination";
import { sponsorEditorCopy } from "../sponsor-editor";

type Destination = "none" | "home" | "website" | "whatsapp" | "phone";
export function sponsorDestination(url: string | null): Destination {
  if (!url) return "none";
  if (url === "/") return "home";
  if (url.startsWith("tel:")) return "phone";
  if (url.startsWith("https://wa.me/")) return "whatsapp";
  return "website";
}
const defaults: Record<Destination, string | null> = { none: null, home: "/", website: "https://", whatsapp: "https://wa.me/", phone: "tel:" };

export function SponsorDestinationField({ url, onChange, locale, error }: {
  url: string | null; onChange: (url: string | null) => void; locale: BusinessLocale; error: boolean;
}) {
  const copy = sponsorEditorCopy[locale];
  const mode = sponsorDestination(url);
  return <div className="space-y-3">
    <CustomSelect label={copy.destination} ariaLabel={copy.destination} value={mode} onChange={(value) => onChange(defaults[value])}
      options={(["none", "home", "website", "whatsapp", "phone"] as const).map((value) => ({ value, label: copy[value] }))} />
    {mode === "website" && <EditorField label={copy.website} className={EDITOR_FIELD_CLASS} error={error ? copy.urlError : undefined}>
      <input aria-label={copy.website} type="text" inputMode="url" dir="ltr" value={url ?? ""} maxLength={2048}
        className={editorInputClass(error)} aria-invalid={error} onChange={(event) => onChange(event.target.value || "https://")} />
    </EditorField>}
    {(mode === "whatsapp" || mode === "phone") && <SponsorPhoneDestination key={mode} initialUrl={url ?? ""} mode={mode} onChange={onChange} locale={locale} error={error} />}
  </div>;
}

