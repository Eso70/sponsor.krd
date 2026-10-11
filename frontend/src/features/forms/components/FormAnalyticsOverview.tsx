import { FormAnswerAnalytics } from "./FormAnswerAnalytics";
import { FormSourcePerformance } from "./FormSourcePerformance";
import {
  Eye,
  MousePointerClick,
  Send,
  Target,
  Users,
  ExternalLink,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import type { FormAnalytics } from "../types";
import { completionTime, formCompletionRate } from "../form-response-utils";
import type { FormLanguage } from "../types";
import type { FormsCopy } from "../forms-copy";

export function FormAnalyticsOverview({
  metrics,
  copy,
  locale,
}: {
  metrics: FormAnalytics;
  copy: FormsCopy;
  locale: FormLanguage;
}) {
  const peakDailyResponses = Math.max(
    1,
    ...(metrics.insights?.daily.map((day) => day.count) ?? []),
  );
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {copy.overview}
        </h2>
        <span className="text-xs text-slate-500">{copy.allTime}</span>
      </div>
      <StatCardGrid columns={3}>
        <StatCard
          icon={Eye}
          label={copy.views}
          value={metrics.views}
          color="purple"
        />
        <StatCard
          icon={MousePointerClick}
          label={copy.starts}
          value={metrics.starts}
          color="green"
        />
        <StatCard
          icon={Send}
          label={copy.submissions}
          value={metrics.submissions}
          color="orange"
        />
        <StatCard
          icon={Target}
          label={copy.rate}
          value={formCompletionRate(metrics.completion)}
          subtitle={copy.ratePeriod}
          color="theme"
        />
        <StatCard
          icon={Users}
          label={copy.visitors}
          value={metrics.visitors}
          color="slate"
        />
        <StatCard
          icon={ExternalLink}
          label={copy.interactions}
          value={metrics.clicks}
          color="blue"
        />
      </StatCardGrid>
      {metrics.insights && (
        <details className="rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
          <summary className="cursor-pointer text-sm font-semibold">
            {copy.insights}
          </summary>
          <div className="mt-4 space-y-5">
            <FormSourcePerformance
              rows={metrics.insights.sourcePerformance ?? []}
              copy={copy}
            />
            <FormAnswerAnalytics
              questions={metrics.insights.answerSummaries ?? []}
              copy={copy}
            />
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">{copy.averageTime}</dt>
                <dd className="mt-1 text-sm font-semibold">
                  {completionTime(metrics.insights.averageDurationMs, copy)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">
                  {copy.latestResponse}
                </dt>
                <dd className="mt-1 text-sm font-semibold">
                  {metrics.insights.latestSubmissionAt
                    ? new Intl.DateTimeFormat(
                        locale === "ckb" ? "ckb-IQ" : locale,
                        { dateStyle: "medium", timeStyle: "short" },
                      ).format(new Date(metrics.insights.latestSubmissionAt))
                    : "—"}
                </dd>
              </div>
            </dl>
            <div>
              <h3 className="mb-3 text-xs font-semibold">
                {copy.recentResponses}
              </h3>
              <div
                className="flex h-28 items-end gap-1.5"
                role="img"
                aria-label={copy.recentResponses}
              >
                {metrics.insights.daily.map((day) => (
                  <div
                    key={day.day}
                    className="flex min-w-0 flex-1 flex-col items-center gap-1"
                    style={{ height: "100%", justifyContent: "flex-end" }}
                    title={`${day.day}: ${day.count}`}
                  >
                    <span className="text-[10px] text-slate-500">
                      {day.count}
                    </span>
                    <span
                      className="theme-fill w-full rounded-t-md"
                      style={{
                        height: `${Math.max(2, (80 * day.count) / peakDailyResponses)}%`,
                      }}
                    />
                    <span className="text-[9px] text-slate-500">
                      {day.day.slice(8)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { title: copy.topSources, rows: metrics.insights.sources },
                { title: copy.topDevices, rows: metrics.insights.devices },
                { title: copy.topCountries, rows: metrics.insights.countries },
              ].map((group) => (
                <div key={group.title}>
                  <h3 className="mb-2 text-xs font-semibold">{group.title}</h3>
                  {group.rows.length ? (
                    <dl className="space-y-2">
                      {group.rows.slice(0, 5).map((row, index) => (
                        <div
                          key={`${row.label}-${index}`}
                          className="flex justify-between gap-3 text-xs"
                        >
                          <dt className="min-w-0 break-words text-slate-500">
                            {row.label || copy.unknownSource}
                          </dt>
                          <dd className="font-semibold">{row.count}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-xs text-slate-500">{copy.noInsights}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
