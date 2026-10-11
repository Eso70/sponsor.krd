"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { FormsCopy } from "../forms-copy";
import { formReturnDestination } from "../form-return-destination";

export function FormReturnAction({
  copy,
  onReturn,
}: {
  copy: FormsCopy;
  onReturn: (url: string) => void;
}) {
  const [destination] = useState(() =>
    typeof window === "undefined"
      ? null
      : formReturnDestination(document.referrer, window.location.href),
  );
  return (
    <div className="space-y-2 text-center">
      {destination && (
        <a
          href={destination.href}
          rel="noreferrer"
          onClick={() => onReturn(destination.href)}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-400/30 px-4 py-3 text-sm font-semibold hover:bg-slate-400/10"
        >
          <ArrowLeft aria-hidden className="size-4 rtl:rotate-180" />
          {destination.kind === "tiktok"
            ? copy.returnTikTok
            : destination.kind === "open-tiktok"
              ? copy.openTikTok
              : copy.returnSource}
        </a>
      )}
      <p className="text-xs leading-relaxed opacity-70">{copy.returnHint}</p>
    </div>
  );
}
