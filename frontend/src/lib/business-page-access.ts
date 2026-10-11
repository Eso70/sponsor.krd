type PermissionOutcome = "allow" | "approval" | "deny";

export type BusinessDashboardPage =
  | "linktrees"
  | "forms"
  | "tiktok-config"
  | "advertising"
  | "templates"
  | "profile"
  | "settings";

export type BusinessSettingsTab =
  "profile" | "defaults" | "security" | "messages";

interface AccessManifestLike {
  permissions?: Record<string, { outcome?: PermissionOutcome } | undefined>;
  subscription?: {
    planCode?: string;
  };
}

const PAGE_PERMISSIONS: Partial<Record<BusinessDashboardPage, string>> = {
  linktrees: "business:pages:linktrees-access",
  forms: "business:forms:read",
  "tiktok-config": "business:tiktok:update",
  advertising: "business:pages:advertising-access",
  templates: "business:pages:templates-access",
  profile: "business:pages:profile-access",
};

const SETTINGS_TAB_PERMISSIONS: Record<
  Exclude<BusinessSettingsTab, "messages">,
  string
> = {
  profile: "business:settings:profile-access",
  defaults: "business:settings:defaults-access",
  security: "business:settings:security-access",
};

export function isBusinessPageLocked(
  page: BusinessDashboardPage,
  access: AccessManifestLike | null | undefined,
): boolean {
  // Settings is always reachable. Its individual tabs own their lock state.
  if (page === "settings") return false;
  const permission = PAGE_PERMISSIONS[page];
  if (!permission) return false;
  const outcome = access?.permissions?.[permission]?.outcome;
  const planCode = access?.subscription?.planCode?.trim().toLowerCase();
  if (page === "forms" && planCode !== "max") return true;
  if (page === "advertising" && planCode !== "ultra" && planCode !== "max")
    return true;
  return page === "advertising" || page === "forms"
    ? outcome !== "allow"
    : outcome === "deny";
}

export function isBusinessSettingsTabLocked(
  tab: BusinessSettingsTab,
  access: AccessManifestLike | null | undefined,
): boolean {
  if (tab === "messages") return false;
  return (
    access?.permissions?.[SETTINGS_TAB_PERMISSIONS[tab]]?.outcome === "deny"
  );
}

/** Unavailable pages disappear from navigation instead of advertising locked features. */
export function isBusinessPageVisible(
  page: BusinessDashboardPage,
  access: AccessManifestLike | null | undefined,
): boolean {
  return Boolean(access) && !isBusinessPageLocked(page, access);
}
