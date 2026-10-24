export type DashboardLoadingKind =
  | "forms"
  | "linktrees"
  | "templates"
  | "settings"
  | "tiktok"
  | "businesses"
  | "pending";

/** Only show a structural skeleton when its upcoming page is known. */
export function dashboardLoadingKind(
  pathname: string,
  scope: "business" | "platform",
): DashboardLoadingKind {
  const parts = pathname.split("?")[0].split("/").filter(Boolean);
  const page = parts.at(-1);
  if (page === "forms") return "forms";
  if (
    page === "linktrees" ||
    page === "pages" ||
    (scope === "business" && page === "business")
  )
    return "linktrees";
  if (page === "templates") return "templates";
  if (scope === "business" && (page === "settings" || page === "profile"))
    return "settings";
  if (scope === "business" && page === "tiktok-config") return "tiktok";
  if (scope === "platform" && (page === "businesses" || parts.length <= 1))
    return "businesses";
  return "pending";
}

export const dashboardLoadingCopy = {
  en: {
    loading: "Loading",
    settings: "Loading settings",
    templates: "Loading templates",
    tiktok: "Loading TikTok settings",
  },
  ar: {
    loading: "جارٍ التحميل",
    settings: "جارٍ تحميل الإعدادات",
    templates: "جارٍ تحميل القوالب",
    tiktok: "جارٍ تحميل إعدادات تيك توك",
  },
  ckb: {
    loading: "بارکردن",
    settings: "ڕێکخستنەکان بار دەکرێن",
    templates: "قاڵبەکان بار دەکرێن",
    tiktok: "ڕێکخستنەکانی تیکتۆک بار دەکرێن",
  },
};
