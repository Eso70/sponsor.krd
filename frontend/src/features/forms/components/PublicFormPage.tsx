"use client";
import { useEffect, useMemo, useRef } from "react";
import { TikTokPixel } from "@/components/analytics/TikTokPixel";
import { getAnalyticsAttribution } from "@/lib/utils/client-queue";
import type { PublicFormPayload } from "@linktree/types";
import { FormPreview, type FormResponseValues } from "./FormPreview";
import { PublicFormShell } from "./PublicFormShell";
import { FormReturnAction } from "./FormReturnAction";
import { formsCopy } from "../forms-copy";
import { formsApi } from "../api";
import { createPageTracker } from "@/features/analytics/page-tracking";
import { createRuntimeId } from "@/lib/utils/random-id";
import { getVisitorId, getAnalyticsSessionId } from "@/lib/utils/visitor-id";
export function PublicFormPage({
  form,
  analytics,
  privacyVersion,
}: PublicFormPayload) {
  const startedAt = useRef<number | null>(null);
  const requestId = useRef<string | null>(null);
  const tracker = useMemo(
    () =>
      createPageTracker({
        pageId: form.id,
        pageName: form.name,
        contentType: "form",
        analytics,
      }),
    [form.id, form.name, analytics],
  );
  useEffect(() => {
    tracker.trackView();
  }, [tracker]);
  const start = () => {
    startedAt.current ??= Date.now();
    tracker.trackEngagement("form_view", {
      once: true,
      actionKey: "form:start",
    });
  };
  const submit = async (response: FormResponseValues) => {
    requestId.current ??= createRuntimeId();
    await formsApi.submit(form.slug!, {
      ...response,
      privacyVersion,
      durationMs: Math.min(
        86400000,
        Math.max(0, Date.now() - (startedAt.current ?? Date.now())),
      ),
      revision: form.revision!,
      requestId: requestId.current,
      tracking: {
        visitorId: getVisitorId(),
        sessionId: getAnalyticsSessionId(),
        ...getAnalyticsAttribution(),
      },
    });
    tracker.trackServerConversion("form:submit", requestId.current);
  };
  return (
    <PublicFormShell
      layout={form.layout}
      appearance={form.appearance}
      language={form.language}
      onChangeCapture={start}
    >
      <TikTokPixel pixelIds={analytics.pixelIds} pageKey={form.id} />
      <FormPreview
        presentation="public"
        completionFooter={
          <FormReturnAction
            copy={formsCopy(form.language)}
            onReturn={(url) =>
              tracker.trackAction("form:return", "button_click", {
                destination: url,
              })
            }
          />
        }
        form={form}
        onSubmit={submit}
        onStart={start}
        onAction={(id, url) =>
          tracker.trackAction(`form:action:${id}`, "button_click", {
            destination: url,
          })
        }
        scrollable={form.layout === "card"}
      />
    </PublicFormShell>
  );
}
