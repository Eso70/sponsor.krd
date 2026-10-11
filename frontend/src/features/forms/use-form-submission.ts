"use client";
import { useRef, useState } from "react";
import { ApiRequestError } from "@/lib/api/request";
import type { FormResponseValues } from "./components/FormPreview";
export function useFormSubmission(
  onSubmit: ((response: FormResponseValues) => Promise<void>) | undefined,
) {
  const [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false);
  const [stale, setStale] = useState(false);
  const lock = useRef(false);
  return {
    busy,
    failed,
    stale,
    async submit(response: FormResponseValues, advance: () => void) {
      if (!onSubmit) {
        advance();
        return;
      }
      if (lock.current) return;
      lock.current = true;
      setBusy(true);
      setFailed(false);
      setStale(false);
      try {
        await onSubmit?.(response);
        advance();
      } catch (error) {
        setStale(error instanceof ApiRequestError && error.status === 409);
        setFailed(true);
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
  };
}
