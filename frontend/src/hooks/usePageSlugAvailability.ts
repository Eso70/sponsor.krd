"use client";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api/request";

/** Checks the authenticated owner's URL namespace, ignoring stale responses. */
export function usePageSlugAvailability(
  endpoint: string,
  slug: string,
  options: {
    enabled: boolean;
    excludeId?: string;
    initialSlug?: string;
  },
) {
  const { enabled, excludeId, initialSlug } = options;
  const [revision, setRevision] = useState(0);
  const [checked, setChecked] = useState<{
    key: string;
    available?: boolean;
    failed?: boolean;
  } | null>(null);
  const key = JSON.stringify([endpoint, slug, excludeId, revision]);
  const valid = /^[a-z0-9][a-z0-9-]{1,254}$/.test(slug);
  const unchanged = !!excludeId && slug === initialSlug;
  useEffect(() => {
    if (!enabled || !valid || unchanged) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const query = new URLSearchParams({ slug });
      if (excludeId) query.set("excludeId", excludeId);
      void apiRequest<boolean>(`${endpoint}?${query}`, {
        signal: controller.signal,
      })
        .then((available) => {
          if (typeof available !== "boolean")
            throw new Error("Invalid availability response");
          if (!controller.signal.aborted) setChecked({ key, available });
        })
        .catch(() => {
          if (!controller.signal.aborted) setChecked({ key, failed: true });
        });
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [endpoint, slug, excludeId, enabled, valid, unchanged, key]);
  const current = checked?.key === key ? checked : null;
  return {
    status:
      !enabled || !slug
        ? ("idle" as const)
        : !valid
          ? ("invalid" as const)
          : unchanged
            ? ("available" as const)
            : current?.failed
              ? ("error" as const)
              : current?.available === true
                ? ("available" as const)
                : current?.available === false
                  ? ("taken" as const)
                  : ("checking" as const),
    retry: () => setRevision((value) => value + 1),
  };
}
