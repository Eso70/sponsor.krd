"use client";

import { useEffect, useState } from "react";
import type { SubdomainAvailability } from "@linktree/types";
import { checkSignupSubdomain } from "./api";

export type AvailabilityStatus = "idle" | "checking" | "error" | SubdomainAvailability["reason"];
const validSubdomain = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function useSubdomainAvailability(value: string) {
  const [checked, setChecked] = useState<{ value: string; status: AvailabilityStatus } | null>(null);
  if (checked && checked.value !== value) setChecked(null);
  useEffect(() => {
    if (!value || !validSubdomain.test(value)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void checkSignupSubdomain(value, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) setChecked({ value, status: result.reason });
        })
        .catch(() => {
          if (!controller.signal.aborted) setChecked({ value, status: "error" });
        });
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  const status: AvailabilityStatus = !value ? "idle"
    : !validSubdomain.test(value) ? "invalid"
    : checked?.value === value ? checked.status : "checking";
  return { status, available: status === "available" ? true : status === "idle" || status === "checking" ? null : false };
}
