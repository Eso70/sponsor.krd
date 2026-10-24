"use client";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api/request";

type SlugCheck = { slug: string; available: boolean };

/** Suggestions and availability share the server's owner-scoped duplicate policy. */
export function usePageDuplicateSlug(
  base: string,
  sourceId: string,
  options: { enabled?: boolean; initialSlug?: string } = {},
) {
  const { enabled = true, initialSlug } = options;
  const [edited, setEdited] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [checked, setChecked] = useState<{
    key: string;
    data?: SlugCheck;
    failed?: boolean;
  } | null>(null);
  const key = JSON.stringify([base, sourceId, initialSlug, edited, revision]);
  const valid = edited === null || /^[a-z0-9][a-z0-9-]{1,49}$/.test(edited);
  useEffect(() => {
    if (!valid || !enabled || (edited === null && initialSlug)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(
      () => {
        const query =
          edited === null ? "" : `?slug=${encodeURIComponent(edited)}`;
        void apiRequest<SlugCheck>(
          `${base}/${sourceId}/duplicate-options${query}`,
          { signal: controller.signal },
        )
          .then((data) => {
            if (
              !/^[a-z0-9][a-z0-9-]{1,49}$/.test(data?.slug ?? "") ||
              typeof data.available !== "boolean"
            )
              throw new Error("Invalid slug response");
            if (!controller.signal.aborted) setChecked({ key, data });
          })
          .catch(() => {
            if (!controller.signal.aborted) setChecked({ key, failed: true });
          });
      },
      edited === null ? 0 : 350,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [base, sourceId, edited, revision, valid, key, enabled, initialSlug]);
  const current =
    checked?.key === key
      ? checked
      : edited === null && initialSlug
        ? { failed: false, data: { slug: initialSlug, available: true } }
        : null;
  return {
    slug: edited ?? current?.data?.slug ?? "",
    status: !valid
      ? ("invalid" as const)
      : current?.failed
        ? ("error" as const)
        : current?.data
          ? current.data.available
            ? ("available" as const)
            : ("taken" as const)
          : ("checking" as const),
    setSlug: (value: string) => setEdited(value.toLowerCase()),
    reset: () => {
      setEdited(null);
      setChecked(null);
      setRevision(0);
    },
    retry: () => setRevision((value) => value + 1),
    markTaken: () =>
      setChecked({
        key,
        data: { slug: edited ?? current?.data?.slug ?? "", available: false },
      }),
  };
}
