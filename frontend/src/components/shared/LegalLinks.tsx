import { getPlatformLegalUrl } from "@/lib/utils/app-url";

/** Quiet legal navigation shared by all public Linktree templates. */
export function LegalLinks({ language, privacyLabel, termsLabel, subtle = false }: {
  language: "en" | "ar" | "ckb";
  privacyLabel: string;
  termsLabel: string;
  subtle?: boolean;
}) {
  return <div className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 ${subtle ? "py-2 text-[11px] leading-5" : "text-xs"}`}
    dir={language === "en" ? "ltr" : "rtl"} data-page-legal-links>
    {(["privacy", "terms"] as const).map((kind, index) => <span key={kind} className="inline-flex items-center gap-3">
      {subtle && index > 0 && <span aria-hidden className="opacity-30">·</span>}
      <a href={getPlatformLegalUrl(kind, language)} target="_blank" rel="noopener noreferrer"
        className={subtle ? "rounded-sm opacity-60 transition-opacity hover:opacity-100 hover:underline underline-offset-4 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current motion-reduce:transition-none" : "underline underline-offset-2"}>
        {kind === "privacy" ? privacyLabel : termsLabel}
      </a>
    </span>)}
  </div>;
}
