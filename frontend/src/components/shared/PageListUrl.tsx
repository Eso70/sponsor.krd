"use client";
import { useState } from "react";
import { Check, Copy, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { Tooltip } from "./Tooltip";

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
    <div
      className={
        boxed
          ? "mb-2 rounded-lg border border-gray-200 bg-gray-50 p-2 sm:mb-3 sm:rounded-xl sm:p-3 dark:border-white/10 dark:bg-white/5"
          : ""
      }
    >
      {boxed && (
        <div className="mb-1 flex items-center gap-1 sm:mb-1.5 sm:gap-1.5">
          <LinkIcon className="size-3 shrink-0 text-gray-400 sm:size-3.5" />
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
            URL
          </span>
        </div>
      )}
      <div
        className={`flex items-center gap-1.5 ${boxed ? "" : "flex-wrap"}`}
        dir="ltr"
      >
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
          className={`${boxed ? "min-w-0 flex-1 truncate" : "break-all"} font-mono text-xs text-gray-700 underline decoration-gray-300 transition-colors hover:text-gray-900 hover:decoration-gray-500 dark:text-gray-300 dark:hover:text-white`}
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
              if (await copyToClipboard(url)) setCopiedUrl(url);
              else if (labels.copyError) toast.error(labels.copyError);
            }}
            className="shrink-0 cursor-pointer rounded-lg p-1 text-gray-500 transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 active:scale-90 sm:p-1.5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
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
