"use client";
import { formCompletionRate } from "../form-response-utils";
import {
  ClipboardList,
  Eye,
  Users,
  MousePointerClick,
  Send,
  Target,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import type { FormsCopy } from "../forms-copy";

import type { FormMetrics } from "@linktree/types";
export function FormsStats({
  count,
  copy,
  metrics,
  loading = false,
  unavailable = false,
}: {
  metrics?: FormMetrics & { clicks?: number };
  count: number | null;
  loading?: boolean;
  unavailable?: boolean;
  copy: FormsCopy;
}) {
  return (
    <StatCardGrid columns={3} className="mb-8">
      <StatCard
        loading={loading}
        loadingLabel={copy.loading}
        icon={ClipboardList}
        label={copy.total}
        value={unavailable ? "—" : count ?? "—"}
        color="blue"
      />
      <StatCard
        loading={loading}
        loadingLabel={copy.loading}
        icon={Eye}
        label={copy.views}
        value={unavailable ? "—" : metrics?.views ?? 0}
        color="purple"
      />
      <StatCard
        loading={loading}
        loadingLabel={copy.loading}
        icon={Users}
        label={copy.visitors}
        value={unavailable ? "—" : metrics?.visitors ?? 0}
        color="slate"
      />
      <StatCard
        loading={loading}
        loadingLabel={copy.loading}
        icon={MousePointerClick}
        label={copy.starts}
        value={unavailable ? "—" : metrics?.starts ?? 0}
        color="green"
      />
      <StatCard
        loading={loading}
        loadingLabel={copy.loading}
        icon={Send}
        label={copy.submissions}
        value={unavailable ? "—" : metrics?.submissions ?? 0}
        color="orange"
      />
      <StatCard
        loading={loading}
        loadingLabel={copy.loading}
        icon={Target}
        label={copy.rate}
        value={unavailable ? "—" : formCompletionRate(metrics?.completion)}
        subtitle={copy.ratePeriod}
        color="pink"
      />
    </StatCardGrid>
  );
}
