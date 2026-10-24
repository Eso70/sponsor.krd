"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/request";
import { clearCachedData } from "@/lib/utils/cache";
import type { PagePinControl } from "@/components/shared/PagePinButton";
import { pageActionCopy } from "./i18n/page-action-copy";

/** A shared, serialized write per page; failed requests leave the list unchanged. */
export function usePagePinning(
  apiBase: string,
  locale: PagePinControl["locale"],
  onSaved: (id: string, pinned: boolean) => void | Promise<void>,
): PagePinControl {
  const locks = useRef(new Set<string>());
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  return {
    locale,
    pending,
    async toggle(id, pinned) {
      if (locks.current.has(id)) return;
      locks.current.add(id);
      setPending(new Set(locks.current));
      const copy = pageActionCopy(locale);
      try {
        await apiRequest(`${apiBase}/${id}/pin`, {
          method: "PATCH",
          json: { isPinned: pinned },
        });
        clearCachedData(apiBase);
        clearCachedData(`${apiBase}/${id}`);
        await onSaved(id, pinned);
        toast.success(pinned ? copy.pinned : copy.unpinned);
      } catch (error) {
        console.error("Page pin update failed:", error);
        toast.error(copy.pinFailed);
      } finally {
        locks.current.delete(id);
        setPending(new Set(locks.current));
      }
    },
  };
}
