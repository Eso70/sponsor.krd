"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/request";
import { clearCachedData } from "@/lib/utils/cache";
import { Tooltip } from "@/components/shared/Tooltip";
import { MotionSpinner } from "@/components/motion/MotionPrimitives";
import { Skeleton } from "@/components/shared/Skeleton";

type DefaultPage = { id: string; name: string; seo_name?: string; uid: string };

/** Default-page creation is independent of the new-page starting settings. */
export function DefaultPageCreationCard() {
  const t = useTranslations("SettingsPage");
  const [page, setPage] = useState<DefaultPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void apiRequest<DefaultPage | null>("/api/linktrees/default", { signal: controller.signal })
      .then(setPage)
      .catch(() => { if (!controller.signal.aborted) setFailed(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const create = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const created = await apiRequest<DefaultPage>("/api/linktrees/default", { method: "POST" });
      setPage(created);
      clearCachedData("/api/linktrees");
      toast.success(t("defaultCreated"), { description: t("defaultCreatedHint") });
    } catch {
      toast.error(t("defaultCreateFailed"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      {loading ? (
        <div role="status" aria-label={t("loadingDefaultLinktree")}><Skeleton className="h-12 w-full" /></div>
      ) : failed ? (
        <p role="alert" className="text-sm text-red-500">{t("loadFailed")}</p>
      ) : page ? (
        <div className="flex items-center gap-3.5">
          <FileText className="h-5 w-5 shrink-0 text-slate-500" />
          <div className="min-w-0">
            <p className="font-semibold text-slate-700 dark:text-slate-200">{page.name} <span className="text-xs font-normal">{t("defaultBadge")}</span></p>
            <p className="mt-1 truncate font-mono text-xs text-slate-400">{page.uid}{page.seo_name && ` · ${page.seo_name}`}</p>
          </div>
        </div>
      ) : (
        <div className="py-3 text-center">
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{t("noDefaultPage")}</p>
          <Tooltip content={t("createDefaultTooltip")} side="bottom">
            <button type="button" onClick={() => void create()} disabled={creating}
              className="theme-fill mx-auto flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-3.5 text-xs font-black text-[var(--theme-ink)] shadow-sm transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60">
              {creating ? <MotionSpinner><Loader2 className="h-4 w-4" /></MotionSpinner> : <Plus className="h-4 w-4" />}
              {creating ? t("creating") : t("createDefault")}
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
