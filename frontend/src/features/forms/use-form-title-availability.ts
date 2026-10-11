"use client";
import { useEffect, useState } from "react";
import { formsApi, type FormsScope } from "./api";
import type { FormTitleAvailability } from "@linktree/types";

export function useFormTitleAvailability(
  scope: FormsScope,
  title: string,
  excludeId?: string,
  enabled = true,
) {
  const [revision, setRevision] = useState(0);
  const [checked, setChecked] = useState<{
    key: string;
    data?: FormTitleAvailability;
    failed?: boolean;
  } | null>(null);
  const name = title.trim();
  const key = JSON.stringify([scope, name, excludeId, revision]);
  useEffect(() => {
    if (!enabled || !name) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void formsApi
        .titleAvailability(scope, name, excludeId, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) setChecked({ key, data });
        })
        .catch(() => {
          if (!controller.signal.aborted) setChecked({ key, failed: true });
        });
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [scope, name, excludeId, key, enabled]);
  const current = checked?.key === key ? checked : null;
  const status =
    !enabled || !name
      ? "idle"
      : current?.failed
        ? "error"
        : current?.data
          ? current.data.available
            ? "available"
            : "taken"
          : "checking";
  return {
    status,
    slug: current?.data?.slug,
    retry: () => setRevision((value) => value + 1),
  };
}
