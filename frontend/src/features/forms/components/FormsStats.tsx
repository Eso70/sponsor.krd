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
}: {
  metrics?: FormMetrics & { clicks?: number };
  count: number;
  copy: FormsCopy;
}) {
  return (
    <StatCardGrid columns={3} className="mb-8">
      <StatCard
        icon={ClipboardList}
        label={copy.total}
        value={count}
        color="blue"
      />
      <StatCard
        icon={Eye}
        label={copy.views}
        value={metrics?.views ?? 0}
        color="purple"
      />
      <StatCard
        icon={Users}
        label={copy.visitors}
        value={metrics?.visitors ?? 0}
        color="slate"
      />
      <StatCard
        icon={MousePointerClick}
        label={copy.starts}
        value={metrics?.starts ?? 0}
        color="green"
      />
      <StatCard
        icon={Send}
        label={copy.submissions}
        value={metrics?.submissions ?? 0}
        color="orange"
      />
      <StatCard
        icon={Target}
        label={copy.rate}
        value={formCompletionRate(metrics?.completion)}
        subtitle={copy.ratePeriod}
        color="pink"
      />
    </StatCardGrid>
  );
}
