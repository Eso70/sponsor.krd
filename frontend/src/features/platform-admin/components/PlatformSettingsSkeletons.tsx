"use client";

import { Skeleton } from "@/components/shared/Skeleton";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";

function MetricRows({ count }: { count: number }) {
  return (
    <div
      className={`grid gap-3 sm:grid-cols-2 ${count === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-white/10"
        >
          <Skeleton className="size-9 shrink-0" rounded="rounded-xl" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-4 w-16" rounded="rounded-md" />
            <Skeleton className="h-3 w-24" rounded="rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonRetentionSettings() {
  const { locale } = usePlatformLocale();
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={locale === "ar" ? "جارٍ تحميل إعدادات الاحتفاظ بالبيانات" : locale === "en" ? "Loading retention settings" : "ڕێکخستنەکانی ماوەی هەڵگرتن بار دەکرێن"}
      className="space-y-6"
    >
      <MetricRows count={3} />
      <Skeleton className="h-14 w-full" rounded="rounded-xl" />
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="mb-2 h-3 w-40" rounded="rounded-md" />
            <Skeleton className="h-11 w-full" rounded="rounded-xl" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 border-t border-slate-100 pt-5 dark:border-white/5 sm:grid-cols-2">
        <Skeleton className="h-20 w-full" rounded="rounded-xl" />
        <Skeleton className="h-20 w-full" rounded="rounded-xl" />
      </div>
      <div className="flex justify-between gap-3 border-t border-slate-100 pt-5 dark:border-white/5">
        <Skeleton className="h-8 w-72 max-w-full" rounded="rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36" rounded="rounded-xl" />
          <Skeleton className="h-10 w-32" rounded="rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonMediaSettings() {
  const { locale } = usePlatformLocale();
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={locale === "ar" ? "جارٍ تحميل إعدادات الوسائط" : locale === "en" ? "Loading media settings" : "ڕێکخستنەکانی میدیا بار دەکرێن"}
      className="space-y-6"
    >
      <MetricRows count={4} />
      <div>
        <Skeleton className="mb-3 h-3 w-40" rounded="rounded-md" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-12 w-full"
              rounded="rounded-xl"
            />
          ))}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="mb-2 h-3 w-40" rounded="rounded-md" />
            <Skeleton className="h-11 w-full" rounded="rounded-xl" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 border-t border-slate-100 pt-5 dark:border-white/5 sm:grid-cols-2">
        <Skeleton className="h-20 w-full" rounded="rounded-xl" />
        <Skeleton className="h-20 w-full" rounded="rounded-xl" />
      </div>
      <div className="flex justify-between gap-3 border-t border-slate-100 pt-5 dark:border-white/5">
        <Skeleton className="h-8 w-72 max-w-full" rounded="rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-44" rounded="rounded-xl" />
          <Skeleton className="h-10 w-32" rounded="rounded-xl" />
        </div>
      </div>
    </div>
  );
}
