"use client";
import { AlertTriangle, Clock } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import type { TikTokDeliveryError } from "../api";

function formatWhen(value: string, locale: string): string {
  const at = new Date(value);
  return Number.isNaN(at.getTime()) ? "—" : at.toLocaleString(locale === "ar" ? "ar-IQ" : locale === "en" ? "en-US" : "ckb-IQ", { timeZone: "Asia/Baghdad" });
}

export function TikTokDeliveryErrorRow({ item, flat = false }: { item: TikTokDeliveryError; flat?: boolean }) {
  const t = useTranslations("TikTokDelivery");
  const locale = useLocale();
  const permanent = item.severity === "permanent";
  return (
    <li
      className={flat ? "py-3 text-xs" : `rounded-xl border p-3.5 transition ${
        permanent
          ? "border-red-200 bg-red-50/70 dark:border-red-500/25 dark:bg-red-500/10"
          : "border-amber-200 bg-amber-50/70 dark:border-amber-500/25 dark:bg-amber-500/10"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {permanent ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
        ) : (
          <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        )}
        <span
          className={`text-xs font-bold ${
            permanent
              ? "text-red-700 dark:text-red-300"
              : "text-amber-700 dark:text-amber-300"
          }`}
        >
          {permanent ? t("permanentFailure") : t("retrying")}
        </span>
        {item.pixelId && (
          <span className="rounded-md bg-white/80 px-2 py-0.5 font-mono text-[11px] text-slate-600 shadow-2xs dark:bg-white/10 dark:text-slate-300">
            {item.pixelId}
          </span>
        )}
        {item.statusCode !== null && (
          <span className="rounded-md bg-white/80 px-2 py-0.5 font-mono text-[11px] text-slate-600 shadow-2xs dark:bg-white/10 dark:text-slate-300">
            HTTP {item.statusCode}
          </span>
        )}
      </div>
      <p className="mt-2 break-words text-xs text-slate-700 dark:text-slate-200">
        {item.statusCode === 503 ? t("unavailableError") : item.statusCode === 504 ? t("gatewayError") : /timeout|timed out/i.test(item.message) ? t("timeoutError") : t("providerError")}
      </p>
      <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        {item.events} {t("events")} · {item.attempts} {t("attempts")} · {t("lastSeen")}{" "}
        {formatWhen(item.lastSeenAt, locale)}
      </p>
      <details className="mt-2 break-words">
        <summary className="cursor-pointer">{t("technicalDetails")}</summary>
        <p className="mt-2">{item.message.replace(/<[^>]*>/g, " ").replace(/&#(?:x[0-9a-f]+|[0-9]+);|&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 500)}</p>
      </details>
    </li>
  );
}

