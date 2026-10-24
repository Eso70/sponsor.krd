import { SkeletonPageManagement } from "@/components/shared/SkeletonPageLayouts";
import { LinktreeStats } from "./LinktreeStats";
import { linktreeStatsCopy } from "../linktree-stats-copy";

export function LinktreesPageSkeleton({ locale }: { locale: "en" | "ar" | "ckb" }) {
  return (
    <SkeletonPageManagement loadingLabel={linktreeStatsCopy(locale).loading}
      stats={<LinktreeStats pages={0} views={0} visitors={0} clicks={0}
        clickers={0} contacts={0} loading locale={locale} />} />
  );
}
