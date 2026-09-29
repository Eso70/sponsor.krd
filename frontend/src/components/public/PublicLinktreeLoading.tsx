"use client";

import { useSyncExternalStore } from "react";
import { SkeletonPublicLinktreePage } from "@/components/shared/Skeleton";
import { BUSINESS_PUBLIC_LOCALE_COOKIE, publicBusinessLocale } from "@/features/business/i18n/public-locale";
import { resolveLinktreeHost } from "@/lib/public/linktree-host";
import { publicLinktreeCopy } from "@/features/business/i18n/public-linktree-copy";
import { ROOT_PUBLIC_LOCALE_COOKIE, parseRootPublicLocale } from "@/features/public-site/root-public-locale";

function loadingLabel() {
  if (typeof window === "undefined") return "Loading Linktree page";
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost").split(":")[0].toLowerCase();
  const isPlatformRoot = resolveLinktreeHost(window.location.hostname, rootDomain).isPlatformRoot;
  const cookie = isPlatformRoot ? ROOT_PUBLIC_LOCALE_COOKIE : BUSINESS_PUBLIC_LOCALE_COOKIE;
  const saved = document.cookie.split("; ").find((item) => item.startsWith(`${cookie}=`))?.split("=")[1];
  return publicLinktreeCopy[isPlatformRoot ? parseRootPublicLocale(saved) : publicBusinessLocale(saved)].loading;
}

function subscribe() {
  return () => undefined;
}

export function PublicLinktreeLoading() {
  const label = useSyncExternalStore(subscribe, loadingLabel, () => "Loading Linktree page");
  return <SkeletonPublicLinktreePage loadingLabel={label} />;
}
