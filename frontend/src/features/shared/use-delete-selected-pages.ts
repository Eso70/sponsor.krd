"use client";

import { useRef, useState } from "react";
import { apiRequest } from "@/lib/api/request";
import { clearCachedData } from "@/lib/utils/cache";
import {
  runSelectedPageRequests,
  SelectedPageRequestError,
} from "./run-selected-page-requests";

/** Shared bulk workflow; each existing DELETE endpoint checks its own owner and capability. */
export function useDeleteSelectedPages({
  apiBase,
  enabled,
  onSelectionChange,
  refresh,
}: {
  apiBase: string;
  enabled: boolean;
  onSelectionChange: (ids: readonly string[]) => void;
  refresh: () => void | Promise<void>;
}) {
  const lock = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const remove = async (ids: readonly string[]) => {
    if (!enabled || lock.current || !ids.length)
      throw new Error("Page deletion unavailable");
    lock.current = true;
    setDeleting(true);
    let failed = false;
    try {
      await runSelectedPageRequests(
        ids,
        (id) =>
          apiRequest(`${apiBase}/${encodeURIComponent(id)}`, {
            method: "DELETE",
          }),
        "Some selected pages could not be deleted",
      );
      onSelectionChange([]);
    } catch (error) {
      failed = true;
      if (error instanceof SelectedPageRequestError)
        onSelectionChange(error.failedIds);
      throw error;
    } finally {
      clearCachedData(apiBase);
      ids.forEach((id) => clearCachedData(`${apiBase}/${id}`));
      try {
        await refresh();
      } catch (error) {
        console.error("Page collection refresh after deletion failed:", error);
        if (!failed) throw error;
      } finally {
        lock.current = false;
        setDeleting(false);
      }
    }
  };
  return { deleting, remove };
}
