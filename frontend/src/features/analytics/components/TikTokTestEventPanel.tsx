"use client";

import { useState } from "react";
import type { TikTokEventsApiTestRequest, TikTokEventsApiTestResult, TikTokTestPage } from "@linktree/types";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { EditorField } from "@/components/shared/EditorField";
import { SHARED_CONTROL_CLASS, SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";
import { isApiRequestError } from "@/lib/api/request";
import { testTikTokEventsApi } from "../api";
import type { TikTokPixelGroupCopy } from "./TikTokPixelGroupCard";

type EventName = NonNullable<TikTokEventsApiTestRequest["event_name"]>;

export function TikTokTestEventPanel({ pixelId, hasEventsToken, endpoint, pages, labels }: {
  pixelId: string; hasEventsToken: boolean; endpoint: string;
  pages: TikTokTestPage[]; labels: TikTokPixelGroupCopy;
}) {
  const [pageType, setPageType] = useState<"linktree" | "form">("linktree");
  const [pageId, setPageId] = useState("");
  const [testCode, setTestCode] = useState("");
  const [event, setEvent] = useState<EventName>("ViewContent");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TikTokEventsApiTestResult | null>(null);
  const page = pages.find(item => item.id === pageId && item.pageType === pageType);
  const events: { value: EventName; label: string }[] = [
    { value: "ViewContent", label: labels.viewContent },
    { value: "Contact", label: labels.contact },
    { value: "ClickButton", label: labels.clickButton },
    ...(pageType === "form" ? [{ value: "SubmitForm" as const, label: labels.submitForm }] : []),
  ];
  const canSend = Boolean(page && pixelId.trim() && hasEventsToken && /^[A-Za-z0-9_-]{4,64}$/.test(testCode.trim()));
  async function send() {
    if (!canSend || busy) return;
    setBusy(true);
    setResult(null);
    try {
      setResult(await testTikTokEventsApi(endpoint, {
        pixel_id: pixelId.trim(), page_id: pageId,
        test_event_code: testCode.trim(), event_name: event,
      }));
    } catch (error) {
      const apiError = isApiRequestError(error) ? error : null;
      const details = Array.isArray(apiError?.details)
        ? apiError.details.filter((item): item is string => typeof item === "string").join(" · ") : "";
      setResult({
        success: false, statusCode: apiError?.status ?? 0, tiktokCode: null,
        message: details || apiError?.message || labels.connectionFailed,
        requestId: apiError?.requestId ?? null, pixelId, testEventCode: testCode.trim(),
        eventName: event, sentAt: new Date().toISOString(),
      });
    } finally { setBusy(false); }
  }
  return <section className="mt-4 space-y-3" aria-label={labels.eventAndTest}>
    <div className="grid grid-cols-1 items-end gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
      <CustomSelect label={labels.pageType} ariaLabel={labels.pageType} value={pageType} disabled={busy}
        options={[{ value: "linktree", label: labels.linktree }, { value: "form", label: labels.form }]}
        onChange={value => { setPageType(value); setPageId(""); setEvent("ViewContent"); setResult(null); }} />
      <CustomSelect label={labels.page} ariaLabel={labels.page} value={pageId} disabled={busy} searchable allowEmptySelection
        triggerLabel={page ? undefined : labels.selectPage} emptyLabel={labels.noPages}
        options={pages.filter(item => item.pageType === pageType).map(item => ({ value: item.id, label: item.name, searchTerms: [item.name, item.url] }))}
        onChange={value => { setPageId(value); setResult(null); }} />
      <EditorField label={labels.testCode} hint={labels.fromTikTok}>
        <input aria-label={labels.testCode} value={testCode} disabled={busy} dir="ltr" maxLength={64}
          onChange={e => { setTestCode(e.target.value); setResult(null); }} placeholder="TEST77408"
          className={`${SHARED_CONTROL_CLASS} h-10 w-full px-3.5 text-xs font-mono`} />
      </EditorField>
      <CustomSelect label={labels.eventType} ariaLabel={labels.eventType} value={event} disabled={busy} options={events}
        onChange={value => { setEvent(value); setResult(null); }} />
      <button type="button" onClick={() => void send()} disabled={!canSend || busy}
        className={`${SHARED_SOFT_BUTTON_CLASS} h-10 px-4 text-xs font-semibold disabled:opacity-40`}>
        {busy ? labels.loading : labels.test}
      </button>
    </div>
    {page && <p className="break-all text-xs text-slate-500" dir="ltr">{page.url}</p>}
    <p className="text-xs text-slate-500">{labels.saveBeforeTest}</p>
    {result && <div role="status" className={`space-y-1 text-xs ${result.success ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
      <p className="font-semibold">{result.success ? labels.testSuccess : labels.testFailed} {result.statusCode > 0 && <span>HTTP {result.statusCode}</span>}</p>
      <p>{result.message}</p>
      {result.tiktokCode !== null && <p>TikTok: {result.tiktokCode}</p>}
      {result.success && <p>{result.eventName} · {result.testEventCode} · Server</p>}
      {result.requestId && <p>{labels.requestIdLabel} <span dir="ltr">{result.requestId}</span></p>}
    </div>}
  </section>;
}
