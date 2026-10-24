"use client";
import {
  FileText,
  Eye,
  Users,
  MousePointerClick,
  UserRoundCheck,
  MessageCircle,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { linktreeStatsCopy } from "../linktree-stats-copy";

/** Every overview card shares one pending state and the same two-line layout. */
export function LinktreeStats({
  pages,
  views,
  visitors,
  clicks,
  clickers,
  contacts,
  loading,
  unavailable = false,
  pagesUnavailable = false,
  locale,
}: {
  pages: number;
  views: number;
  visitors: number;
  clicks: number;
  clickers: number;
  contacts: number | null;
  loading: boolean;
  unavailable?: boolean;
  pagesUnavailable?: boolean;
  locale: "en" | "ar" | "ckb";
}) {
  const copy = linktreeStatsCopy(locale);
  return (
    <StatCardGrid columns={3} className="mb-8">
      <StatCard
        loading={loading}
        loadingLabel={copy.loading}
        icon={FileText}
        label={copy.pages}
        value={pagesUnavailable ? "—" : pages}
        color="blue"
      />
      <StatCard
        loading={loading}
        loadingLabel={copy.loading}
        icon={Eye}
        label={copy.views}
        value={unavailable ? "—" : views}
        color="purple"
      />
      <StatCard
        loading={loading}
        loadingLabel={copy.loading}
        icon={Users}
        label={copy.visitors}
        value={unavailable ? "—" : visitors}
        color="slate"
      />
      <StatCard
        loading={loading}
        loadingLabel={copy.loading}
        icon={MousePointerClick}
        label={copy.clicks}
        value={unavailable ? "—" : clicks}
        color="green"
      />
      <StatCard
        loading={loading}
        loadingLabel={copy.loading}
        icon={UserRoundCheck}
        label={copy.clickers}
        value={unavailable ? "—" : clickers}
        color="cyan"
      />
      <StatCard
        loading={loading}
        loadingLabel={copy.loading}
        icon={MessageCircle}
        label={copy.contacts}
        value={unavailable || contacts === null ? "—" : contacts}
        color="orange"
      />
    </StatCardGrid>
  );
}
