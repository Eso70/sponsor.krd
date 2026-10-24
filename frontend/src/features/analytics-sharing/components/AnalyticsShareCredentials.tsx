import type { ReactNode } from "react";
import { Copy, KeyRound, EyeOff } from "lucide-react";
import { AnalyticsShareActionButton } from "./AnalyticsShareActionButton";
import type { AnalyticsShareLink } from "@linktree/types";
import { SHARED_CONTROL_CLASS } from "@/components/shared/shared-control-styles";
import { sharingCopy, type SharingLocale } from "../sharing-copy";

/** Link and its access code stay together, with explicit owner-only recovery. */
export function AnalyticsShareCredentials({
  link,
  code,
  locale,
  busy,
  revealAllowed,
  onCopy,
  onReveal,
  onHide,
  details,
  actions,
}: {
  link: AnalyticsShareLink;
  code?: string;
  locale: SharingLocale;
  busy: boolean;
  revealAllowed: boolean;
  onCopy: (value: string) => void;
  onReveal: () => void;
  onHide: () => void;
  details?: ReactNode;
  actions?: ReactNode;
}) {
  const copy = sharingCopy(locale);
  return (
    <div className="@container min-w-0 space-y-3">
      <label className="block space-y-2">
        <span className="text-xs font-medium">{copy.link}</span>
        <input
          aria-label={copy.copyLink}
          readOnly
          value={link.url}
          dir="ltr"
          className={`${SHARED_CONTROL_CLASS} w-full px-3 py-2 text-xs`}
          onFocus={(event) => event.target.select()}
        />
      </label>
      {code && (
        <div className="space-y-2">
          <p className="text-xs font-medium">{copy.code}</p>
          <p
            className="theme-soft rounded-xl px-4 py-3 text-center text-3xl font-bold tracking-[0.3em]"
            dir="ltr"
          >
            {code}
          </p>
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            {link.canRevealCode ? copy.once : copy.lastReveal}
          </p>
        </div>
      )}
      {details}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <AnalyticsShareActionButton
          label={copy.copyLink}
          icon={Copy}
          tone="primary"
          onClick={() => onCopy(link.url)}
        />
        {code ? (
          <>
            <AnalyticsShareActionButton
              label={copy.copyCode}
              icon={KeyRound}
              tone="primary"
              onClick={() => onCopy(code)}
            />
            <AnalyticsShareActionButton
              label={copy.hideCode}
              icon={EyeOff}
              onClick={onHide}
            />
          </>
        ) : (
          link.canRevealCode && (
            <AnalyticsShareActionButton
              label={copy.showCode}
              icon={KeyRound}
              tone="primary"
              disabled={busy || !revealAllowed}
              onClick={onReveal}
            />
          )
        )}
        {actions}
      </div>
    </div>
  );
}
