"use client";
import { useState } from "react";
import { Check, Copy, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { Tooltip } from "./Tooltip";
import {
  SHARED_CONTROL_CLASS,
  SHARED_SOFT_BUTTON_CLASS,
} from "./shared-control-styles";

export function PageListUrl({
  url,
  displayUrl = url,
  boxed = false,
  labels,
  copied,
  onCopy,
  onOpen,
}: {
  url: string;
  displayUrl?: string;
  boxed?: boolean;
  labels: { copyLink: string; copied: string; copyError?: string };
  copied?: boolean;
  onCopy?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onOpen?: () => void;
}) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const isCopied = copied ?? copiedUrl === url;
  return (
    <div className={boxed ? `${SHARED_CONTROL_CLASS} mb-3 p-2 sm:p-2.5` : ""}>
      <div
        className={`flex items-center gap-1.5 ${boxed ? "" : "min-w-0"}`}
        dir="ltr"
      >
        {boxed && (
          <LinkIcon
            aria-hidden
            className="ms-1 size-4 shrink-0 text-slate-400"
          />
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={url}
          onClick={(event) => {
            if (onOpen && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
              event.preventDefault();
              onOpen();
            }
          }}
          className={`${boxed ? "min-w-0 flex-1 truncate" : "min-w-0 flex-1 break-all"} text-xs text-gray-700 decoration-gray-300 transition-colors hover:text-gray-900 hover:underline hover:decoration-gray-500 dark:text-gray-300 dark:hover:text-white`}
        >
          {displayUrl}
        </a>
        <Tooltip
          content={isCopied ? labels.copied : labels.copyLink}
          side="top"
        >
          <button
            type="button"
            aria-label={labels.copyLink}
            onClick={async (event) => {
              event.stopPropagation();
              if (onCopy) {
                onCopy(event);
                return;
              }
              if (await copyToClipboard(url)) {
                setCopiedUrl(url);
                toast.success(labels.copied);
              } else if (labels.copyError) toast.error(labels.copyError);
            }}
            className={`${SHARED_SOFT_BUTTON_CLASS} flex size-8 shrink-0 cursor-pointer items-center justify-center sm:size-9`}
          >
            {isCopied ? (
              <Check className="size-3.5 text-emerald-600 sm:size-4 dark:text-emerald-400" />
            ) : (
              <Copy className="size-3.5 sm:size-4" />
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
