"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  SharedPageAnalytics,
  AnalyticsShareBranding,
} from "@linktree/types";
import { apiRequest, ApiRequestError } from "@/lib/api/request";
import { BusinessPreAuthLanguageToggle } from "@/features/business/components/BusinessPreAuthLanguageToggle";
import { DashboardHeaderActionButton } from "@/components/shared/DashboardHeaderActionButton";
import { ThemeToggleButton } from "@/components/shared/ThemeToggleButton";
import { ThemeProvider } from "@/lib/contexts/ThemeProvider";
import { RefreshCw } from "lucide-react";
import { HEADER_ACTION_SIZE_CLASS } from "@/components/shared/shared-control-styles";
import { sharingCopy, type SharingLocale } from "../sharing-copy";
import { DashboardHeaderFrame } from "@/components/shared/DashboardHeaderFrame";
import { SharedAnalyticsReportHeader } from "./SharedAnalyticsReportHeader";
import { SharedAnalyticsReport } from "./SharedAnalyticsReport";
import { SharedAnalyticsAccess } from "./SharedAnalyticsAccess";
import { SharedAnalyticsUnavailable } from "./SharedAnalyticsUnavailable";

import { PageAnalyticsRange } from "@/features/analytics/components/PageAnalyticsRange";
import {
  presetToRange,
  type DateRangePreset,
} from "@/features/analytics/page-analytics-range";
import { pageAnalyticsCopy } from "@/features/analytics/page-analytics-copy";

export function SharedAnalyticsPage({
  id,
  initialLocale = "en",
  branding,
}: {
  id: string;
  initialLocale?: SharingLocale;
  branding?: AnalyticsShareBranding;
}) {
  const [locale, setLocale] = useState<SharingLocale>(initialLocale);
  const [data, setData] = useState<SharedPageAnalytics | null>(null);
  const [preset, setPreset] = useState<DateRangePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const range = useMemo(
    () => presetToRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  );
  const invalidRange = !!range.from && !!range.to && range.from > range.to;
  const rangeParams = new URLSearchParams();
  if (range.from) rangeParams.set("from", range.from);
  if (range.to) rangeParams.set("to", range.to);
  const query = rangeParams.toString();
  const previousQuery = useRef(query);
  const [reportLoading, setReportLoading] = useState(false);
  const [code, setCode] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [failed, setFailed] = useState(false);
  const lock = useRef(false),
    generation = useRef(0);
  const authenticated = useRef(false);
  const copy = sharingCopy(locale);
  const base = `/api/public/analytics-shares/${id}`;
  const checkAvailability = useCallback(async () => {
    try {
      await apiRequest(`${base}/branding`);
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        [401, 403, 404, 410].includes(error.status)
      )
        setUnavailable(true);
    }
  }, [base]);
  const read = useCallback(
    async (initial = false) => {
      if (invalidRange) return;
      if (previousQuery.current !== query) {
        setReportLoading(true);
        previousQuery.current = query;
      }
      const request = ++generation.current;
      const hadAccess = authenticated.current;
      try {
        const report = await apiRequest<SharedPageAnalytics>(
          query ? `${base}?${query}` : base,
        );
        if (request === generation.current) {
          authenticated.current = true;
          setData(report);
          setUnavailable(false);
          setFailed(false);
        }
      } catch (error) {
        if (request === generation.current) {
          authenticated.current = false;
          setData(null);
          if (
            hadAccess &&
            error instanceof ApiRequestError &&
            [401, 403, 404, 410].includes(error.status)
          )
            void checkAvailability();
          if (
            !initial ||
            !(error instanceof ApiRequestError && error.status === 401)
          )
            setFailed(true);
        }
      } finally {
        if (request === generation.current) {
          setLoading(false);
          setReportLoading(false);
        }
      }
    },
    [base, checkAvailability, query, invalidRange],
  );
  useEffect(() => {
    const initial = window.setTimeout(() => void read(true), 0);
    const requestGeneration = generation;
    const timer = window.setInterval(() => {
      if (authenticated.current && document.visibilityState === "visible")
        void read(true);
    }, 30_000);
    const visibility = () => {
      if (document.visibilityState === "hidden") {
        generation.current++;
        setData(null);
      } else if (authenticated.current) void read(true);
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      requestGeneration.current++;
      window.clearTimeout(initial);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [read]);
  if (unavailable)
    return <SharedAnalyticsUnavailable locale={locale} branding={branding} />;
  if (!data)
    return (
      <SharedAnalyticsAccess
        branding={branding}
        locale={locale}
        onLocaleChange={setLocale}
        code={code}
        onCodeChange={setCode}
        busy={busy}
        loading={loading}
        failed={failed}
        onSubmit={() => {
          if (lock.current || !/^\d{6}$/.test(code)) return;
          lock.current = true;
          setBusy(true);
          setFailed(false);
          generation.current++;
          void apiRequest(`${base}/unlock`, { method: "POST", json: { code } })
            .then(async () => {
              setCode("");
              await read();
            })
            .catch(() => {
              setData(null);
              setFailed(true);
              void checkAvailability();
            })
            .finally(() => {
              lock.current = false;
              setBusy(false);
            });
        }}
      />
    );
  return (
    <ThemeProvider
      websiteColor={data.accentColor ?? branding?.accentColor ?? null}
    >
      <main
        className="min-h-dvh min-w-0 bg-slate-50 text-slate-800 dark:bg-[#151a21] dark:text-slate-100"
        dir="ltr"
        lang={locale}
      >
        <DashboardHeaderFrame contained surface="page">
          <SharedAnalyticsReportHeader
            name={branding?.name ?? data.name}
            branding={branding}
          />
          <div className="ms-auto flex shrink-0 items-center gap-2">
            {data && (
              <DashboardHeaderActionButton
                type="button"
                aria-label={copy.retry}
                className={HEADER_ACTION_SIZE_CLASS}
                onClick={() => void read()}
              >
                <RefreshCw aria-hidden className="size-4" />
              </DashboardHeaderActionButton>
            )}
            <ThemeToggleButton
              className="rounded-xl"
              copy={{ label: copy.theme, light: copy.light, dark: copy.dark }}
            />
            <BusinessPreAuthLanguageToggle
              locale={locale}
              onChange={setLocale}
            />
          </div>
        </DashboardHeaderFrame>
        <div className="mx-auto min-w-0 max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
          <SharedAnalyticsReport
            data={data}
            pending={reportLoading}
            locale={locale}
            apiBase={base}
            rangeControl={
              <PageAnalyticsRange
                title={data.name}
                labels={pageAnalyticsCopy(locale)}
                locale={locale}
                preset={preset}
                setPreset={setPreset}
                customFrom={customFrom}
                setCustomFrom={setCustomFrom}
                customTo={customTo}
                setCustomTo={setCustomTo}
              />
            }
            onAccessLost={() => {
              generation.current++;
              authenticated.current = false;
              setData(null);
              setFailed(true);
              void checkAvailability();
            }}
          />
        </div>
      </main>
    </ThemeProvider>
  );
}
