"use client";
import { useState } from "react";
import { EditorSection } from "@/components/shared/EditorSection";
import { WhatsAppQuestionAnalytics } from "./WhatsAppQuestionAnalytics";
import type { PageAnalyticsInsights } from "@linktree/types";
import { Clock3, Target, Users, Activity } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { analyticsInsightsCopy } from "../analytics-insights-copy";

export function PageEngagementOverview({
  insights,
  locale,
}: {
  insights?: PageAnalyticsInsights;
  locale: "en" | "ar" | "ckb";
}) {
  const copy = analyticsInsightsCopy[locale];
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [outcomesOpen, setOutcomesOpen] = useState(false);
  const measured = insights && insights.measuredVisits > 0;
  const names: Record<string, string> = {
    direct: copy.direct,
    referral: copy.referral,
    search: copy.search,
    mobile: copy.mobile,
    desktop: copy.desktop,
    tablet: copy.tablet,
    unknown: copy.unknown,
    email: copy.email,
    sms: copy.sms,
    tiktok_paid: copy.paidTikTok,
    tiktok_organic: "TikTok",
    facebook: "Facebook",
    instagram: "Instagram",
    snapchat: "Snapchat",
    youtube: "YouTube",
  };
  return (
    <section className="space-y-4">
      <EditorSection
        title={copy.additional}
        open={detailsOpen}
        onToggle={() => setDetailsOpen(!detailsOpen)}
      >
        {detailsOpen && (
          <>
            <StatCardGrid columns={2}>
              <StatCard
                color="pink"
                icon={Target}
                label={copy.contact}
                value={insights?.contactActions ?? "—"}
              />
              <StatCard
                color="green"
                icon={Users}
                label={copy.contacts}
                value={insights?.contactVisitors ?? "—"}
              />
              <StatCard
                color="cyan"
                icon={Clock3}
                label={copy.activeTime}
                value={
                  measured
                    ? `${Math.round(insights.averageActiveSeconds)} ${copy.seconds}`
                    : "—"
                }
                subtitle={
                  measured
                    ? `${insights.measuredVisits} ${copy.samples}`
                    : copy.notMeasured
                }
              />{" "}
              <StatCard
                color="orange"
                icon={Activity}
                label={copy.engagement}
                value={
                  measured
                    ? `${((insights.engagedVisits / insights.measuredVisits) * 100).toFixed(1)}%`
                    : "—"
                }
              />
            </StatCardGrid>
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              {copy.timeNote}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: copy.sources, rows: insights?.channels },
                { label: copy.devices, rows: insights?.devices },
              ].map(({ label, rows }) => (
                <section
                  key={label}
                  className="rounded-2xl bg-slate-50/70 p-4 dark:bg-white/[0.03]"
                >
                  <h3 className="mb-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {label}
                  </h3>
                  {rows?.length ? (
                    <div className="space-y-2">
                      {rows.map((row) => (
                        <div
                          key={row.name}
                          className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400"
                        >
                          <span>{names[row.name] ?? row.name}</span>
                          <span className="tabular-nums">{row.views}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">{copy.notMeasured}</p>
                  )}
                </section>
              ))}
            </div>
          </>
        )}
      </EditorSection>
      <EditorSection
        title={copy.outcomes}
        open={outcomesOpen}
        onToggle={() => setOutcomesOpen(!outcomesOpen)}
      >
        {outcomesOpen && (
          <>
            <StatCardGrid columns={2}>
              <StatCard
                color="green"
                icon={Target}
                label={copy.confirmed}
                value={
                  insights?.confirmedOutcomes ? insights.confirmedOutcomes : "—"
                }
                subtitle={
                  insights?.confirmedOutcomes ? undefined : copy.notMeasured
                }
              />{" "}
              <StatCard
                color="purple"
                icon={Target}
                label={copy.revenue}
                value={
                  insights?.revenue?.length
                    ? insights.revenue
                        .map(
                          (row) =>
                            `${row.currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(row.value)}`,
                        )
                        .join(" · ")
                    : "—"
                }
                subtitle={
                  insights?.revenue?.length ? undefined : copy.notMeasured
                }
              />
            </StatCardGrid>
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              {copy.note}
            </p>
          </>
        )}
      </EditorSection>
      <WhatsAppQuestionAnalytics data={insights?.whatsapp} locale={locale} />
    </section>
  );
}
