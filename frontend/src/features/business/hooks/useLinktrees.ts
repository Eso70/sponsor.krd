"use client";

import { useCallback, useEffect, useState } from "react";
import { useLatestRequest } from "@/hooks/useLatestRequest";
import { sortLinktreesForDashboard } from "@/features/link-editor/linktree-list-order";
export { sortLinktreesForDashboard } from "@/features/link-editor/linktree-list-order";
import type { BusinessLinktreeSummary as Linktree } from "@linktree/types";

/**
 * The backend demotes the previous default whenever another page is saved as
 * default, so the list mirrors that instead of showing two default pages until
 * the next reload.
 */
function withSingleDefault(items: Linktree[], defaultId: string): Linktree[] {
  return items.map((item) =>
    item.id === defaultId || !item.is_default
      ? item
      : { ...item, is_default: false },
  );
}

export function useLinktrees(initialLinktrees: Linktree[]) {
  const startRequest = useLatestRequest();
  const [linktrees, setLinktrees] = useState<Linktree[]>(() =>
    sortLinktreesForDashboard(initialLinktrees),
  );
  const [isLoading, setIsLoading] = useState(initialLinktrees.length === 0);
  const [unavailable, setUnavailable] = useState(false);

  const reload = useCallback(
    async (
      showLoading = false,
      bypassCache = false,
      rethrow = false,
    ) => {
      const current = startRequest();
      if (showLoading) setIsLoading(true);

      try {
        const { fetchWithCache } = await import("@/lib/utils/cache");
        const url = bypassCache
          ? `/api/linktrees?_t=${Date.now()}`
          : "/api/linktrees";
        const result = await fetchWithCache<Linktree[]>(
          url,
          undefined,
          "/api/linktrees",
          bypassCache,
          (value): value is Linktree[] => Array.isArray(value),
        );

        if (!current()) return;
        setLinktrees(sortLinktreesForDashboard(result || []));
        setUnavailable(false);
      } catch (error) {
        if (!current()) return;
        console.error("Error fetching linktrees:", error);
        setUnavailable(true);
        if (rethrow) throw error;
      } finally {
        if (current()) setIsLoading(false);
      }
    },
    [startRequest],
  );

  useEffect(() => {
    if (initialLinktrees.length === 0) {
      const frame = requestAnimationFrame(() => void reload(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [initialLinktrees.length, reload]);

  const removeLinktree = useCallback((id: string) => {
    setLinktrees((current) => current.filter((linktree) => linktree.id !== id));
  }, []);

  const mergeLinktree = useCallback(
    (id: string, changes: Partial<Linktree>) => {
      // Re-sorted because an edit can promote a page to default, and the
      // default page has to stay first without waiting for a reload.
      setLinktrees((current) => {
        const merged = current.map((linktree) =>
          linktree.id === id ? { ...linktree, ...changes } : linktree,
        );
        return sortLinktreesForDashboard(
          changes.is_default ? withSingleDefault(merged, id) : merged,
        );
      });
    },
    [],
  );

  const prependLinktree = useCallback((linktree: Linktree) => {
    setLinktrees((current) => {
      const next = [linktree, ...current];
      return sortLinktreesForDashboard(
        linktree.is_default ? withSingleDefault(next, linktree.id) : next,
      );
    });
  }, []);

  const mapLinktrees = useCallback(
    (mapper: (linktree: Linktree) => Linktree) => {
      setLinktrees((current) => current.map(mapper));
    },
    [],
  );

  return {
    unavailable,
    linktrees,
    isLoading,
    reload,
    removeLinktree,
    mergeLinktree,
    prependLinktree,
    mapLinktrees,
  };
}
