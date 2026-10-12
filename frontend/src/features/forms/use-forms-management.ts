"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { FormDraft, FormMetrics, FormSummary } from "@linktree/types";
import { ApiRequestError } from "@/lib/api/request";
import { formsApi, type FormsScope } from "./api";
export function useFormsManagement(
  scope: FormsScope,
  page = 0,
  query = "",
  filter = "active",
) {
  const requestKey = JSON.stringify([scope, page, query, filter]);
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const operationLock = useRef(false);
  const [failureReason, setFailureReason] = useState<
    "generic" | "publish" | "conflict"
  >("generic");
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [metrics, setMetrics] = useState<FormMetrics>({
    views: 0,
    visitors: 0,
    starts: 0,
    submissions: 0,
  });
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false);
  const request = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    return Promise.all([
      formsApi.list(scope, page, query, filter, controller.signal),
      formsApi.stats(scope, controller.signal),
    ])
      .then(([items, stats]) => {
        if (controller.signal.aborted) return;
        setFailed(false);
        setFailureReason("generic");
        setForms(items.items);
        setTotal(items.total);
        setMetrics(stats);
        return true;
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
        return false;
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
        setSettledKey(requestKey);
      });
  }, [scope, page, query, filter, requestKey]);
  useEffect(() => {
    void load();
    return () => request.current?.abort();
  }, [load]);
  const mutate = async <T>(
    operation: () => Promise<T>,
    refresh = true,
    reason: "generic" | "publish" = "generic",
    reportFailure = true,
  ): Promise<T> => {
    if (operationLock.current)
      throw new Error("An operation is already in progress");
    operationLock.current = true;
    setBusy(true);
    setFailed(false);
    try {
      const result = await operation();
      if (refresh) await load();
      return result;
    } catch (error) {
      setFailureReason(
        error instanceof ApiRequestError && error.status === 409
          ? "conflict"
          : reason,
      );
      if (reportFailure) setFailed(true);
      throw error;
    } finally {
      operationLock.current = false;
      setBusy(false);
    }
  };
  return {
    forms,
    total,
    metrics,
    loading: loading || settledKey !== requestKey,
    busy,
    failed,
    failureReason,
    load: async () => {
      setLoading(true);
      setFailed(false);
      return load();
    },
    get: (form: FormSummary) =>
      mutate(() => formsApi.get(scope, form.id), false),
    save: (form: FormDraft, isNew: boolean) =>
      mutate(() => formsApi.save(scope, form, isNew), true, "generic", false),
    status: (form: FormSummary, status: FormDraft["status"]) =>
      mutate(
        () => formsApi.status(scope, form.id, status),
        true,
        status === "active" ? "publish" : "generic",
      ),
    archive: (form: FormSummary) =>
      mutate(() => formsApi.archive(scope, form.id, !form.isArchived)),
    remove: (id: string) => mutate(() => formsApi.remove(scope, id)),
  };
}
