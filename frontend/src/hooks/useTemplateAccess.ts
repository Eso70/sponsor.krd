"use client";
import { useLatestRequest } from "@/hooks/useLatestRequest";
import { useCallback, useEffect, useState } from "react";

export function useTemplateAccess(enabled = true) {
  const startRequest = useLatestRequest();
  const [unavailable, setUnavailable] = useState(false);
  const [loadedKeys, setLoadedKeys] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(enabled);

  const refresh = useCallback(
    async (options?: { rethrow?: boolean; signal?: AbortSignal }) => {
      if (!enabled) return;
      const current = startRequest();
      try {
        const response = await fetch("/api/auth/template-access", {
          credentials: "include",
          cache: "no-store",
          signal: options?.signal,
        });
        if (!response.ok) throw new Error("Unable to load template access");
        const result = await response.json();
        const keys = result?.data?.template_keys;
        if (!Array.isArray(keys)) throw new Error("Invalid template access");
        if (options?.signal?.aborted || !current()) return;
        setUnavailable(false);
        setLoadedKeys(
          Array.isArray(keys)
            ? new Set(
                keys.filter((key): key is string => typeof key === "string"),
              )
            : new Set(),
        );
      } catch (error) {
        if (options?.signal?.aborted || !current()) return;
        setUnavailable(true);
        if (options?.rethrow) throw error;
      }
    },
    [enabled, startRequest],
  );

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void refresh({ signal: controller.signal }).finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, refresh]);

  const allowedKeys = enabled ? loadedKeys : null;

  return {
    allowedKeys,
    unavailable: enabled && unavailable,
    isLoading: enabled && isLoading,
    refresh,
    isTemplateAllowed: (key: string) =>
      allowedKeys === null || allowedKeys.has(key),
  };
}
