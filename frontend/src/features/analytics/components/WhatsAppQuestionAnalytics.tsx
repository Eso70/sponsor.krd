"use client";
import { useState } from "react";
import type { PageAnalyticsInsights } from "@linktree/types";
import { MessageCircle, MousePointerClick, X } from "lucide-react";
import { EditorSection } from "@/components/shared/EditorSection";
import { StatCard } from "@/components/shared/StatCard";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { analyticsInsightsCopy } from "../analytics-insights-copy";

export function WhatsAppQuestionAnalytics({
  data,
  locale,
}: {
  data?: PageAnalyticsInsights["whatsapp"];
  locale: "en" | "ar" | "ckb";
}) {
  const [open, setOpen] = useState(false);
  const copy = analyticsInsightsCopy[locale];
  return (
    <EditorSection
      title={`${copy.questions}${data?.selected ? ` · ${data.selected}` : ""}`}
      open={open}
      onToggle={() => setOpen(!open)}
    >
      {open && (
        <>
          <StatCardGrid columns={3}>
            <StatCard
              color="cyan"
              icon={MessageCircle}
              label={copy.chooserOpens}
              value={data?.opened ?? "—"}
            />
            <StatCard
              color="green"
              icon={MousePointerClick}
              label={copy.selections}
              value={data?.selected ?? "—"}
            />
            <StatCard
              color="orange"
              icon={X}
              label={copy.dismissed}
              value={data?.dismissed ?? "—"}
            />
          </StatCardGrid>
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            {copy.questionNote}
          </p>
          {data?.questions.length ? (
            <div className="space-y-3">
              {data.questions.map((question) => (
                <article
                  key={question.id}
                  className="rounded-xl bg-white/70 p-4 dark:bg-white/[0.03]"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4
                      className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                      dir="auto"
                    >
                      {question.label}
                    </h4>
                    {question.historical && (
                      <span className="text-[10px] text-slate-400">
                        {copy.historical}
                      </span>
                    )}
                  </div>
                  <dl className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <dt className="text-slate-400">{copy.questionClicks}</dt>
                      <dd className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        {question.clicks}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">{copy.visitors}</dt>
                      <dd className="mt-1 font-semibold text-sky-600 dark:text-sky-400">
                        {question.uniqueVisitors}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">{copy.selectionShare}</dt>
                      <dd className="mt-1 font-semibold text-violet-600 dark:text-violet-400">
                        {data.selected
                          ? ((question.clicks / data.selected) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </dd>
                    </div>
                  </dl>
                  {question.lastSelectedAt && (
                    <p className="mt-3 text-[11px] text-slate-400">
                      {copy.lastSelected}:{" "}
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(question.lastSelectedAt))}
                    </p>
                  )}
                  {question.links.length > 0 && (
                    <details className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      <summary className="cursor-pointer">{copy.links}</summary>
                      <div className="mt-2 space-y-1">
                        {question.links.map((link, index) => (
                          <div
                            key={`${question.id}:${index}`}
                            className="flex justify-between gap-3"
                          >
                            <span dir="auto">{link.label}</span>
                            <span>{link.clicks}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">{copy.notMeasured}</p>
          )}
        </>
      )}
    </EditorSection>
  );
}
