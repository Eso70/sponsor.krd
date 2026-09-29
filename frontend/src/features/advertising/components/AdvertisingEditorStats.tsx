import { useMemo } from "react";
import { Eye, Package, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import type { AdvertisingServiceConfig } from "../types";

export function AdvertisingEditorStats({
  config,
  translate = (text) => text,
}: {
  config: AdvertisingServiceConfig;
  translate?: (text: string) => string;
}) {
  const t = translate;
  const stats = useMemo(() => {
    const sections = Object.values(config.sections);
    return {
      packages: Object.values(config.packageTiers).flat().length,
      providers: config.paymentProviders.length,
      results: config.results.length,
      visibleSections: sections.filter(Boolean).length,
      totalSections: sections.length,
    };
  }, [config]);

  return (
    <StatCardGrid columns={4}>
      <StatCard icon={Wallet} label={t("شێوازی پارەدان")} value={stats.providers} color="green" />
      <StatCard
        icon={Eye}
        label={t("بەشە دەرکەوتووەکان")}
        value={`${stats.visibleSections} / ${stats.totalSections}`}
        color="purple"
      />
      <StatCard icon={Package} label={t("پاکێجەکان")} value={stats.packages} color="blue" />
      <StatCard icon={TrendingUp} label={t("ئەنجامەکان")} value={stats.results} color="orange" />
    </StatCardGrid>
  );
}
