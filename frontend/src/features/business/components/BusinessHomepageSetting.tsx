"use client";

import { useTranslations } from "next-intl";
import { VisibilitySwitch } from "@/components/shared/VisibilitySwitch";

export function BusinessHomepageSetting({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const t = useTranslations("SettingsPage");
  return (
    <div className="mt-5 space-y-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
      <VisibilitySwitch
        checked={checked}
        onChange={onChange}
        label={t("homepageLinktree")}
        stateLabel={t("homepageLinktree")}
      />
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t("homepageLinktreeHelp")}
      </p>
    </div>
  );
}
