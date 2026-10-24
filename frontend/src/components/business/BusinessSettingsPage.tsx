"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLatestRequest } from "@/hooks/useLatestRequest";
import { useRegisterDashboardRefresh } from "@/components/shared/dashboard-refresh";
import { RequestErrorNotice } from "@/components/shared/RequestErrorNotice";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { businessMessages } from "@/features/business/i18n/messages";
import {
  Building2,
  Clock3,
  MessageSquare,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { ColorGradientModal } from "@/components/shared/ColorGradientModal";
import { PageManagementSection } from "@/components/shared/PageManagementSection";
import { BusinessBrandingFields } from "@/features/business/components/BusinessBrandingFields";
import { TEMPLATE_OPTIONS } from "@/lib/templates/config";
import { settingsInputClass as inputClass } from "@/components/shared/settings-styles";
import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { VisibilitySwitch } from "@/components/shared/VisibilitySwitch";
import { SettingsField as Field } from "@/components/shared/SettingsField";
import { DashboardRefreshRegion } from "@/components/shared/DashboardRefreshRegion";
import { SectionSaveActions } from "@/components/shared/SectionSaveActions";
import { TabSaveButton } from "@/components/shared/TabSaveButton";
import { Tooltip } from "@/components/shared/Tooltip";
import { StatCard } from "@/components/shared/StatCard";
import { SkeletonSettingsPage } from "@/components/shared/SkeletonPageLayouts";
import { LinktreeDefaultAppearanceFields } from "@/features/link-editor/components/LinktreeDefaultAppearanceFields";
import { DEFAULT_LINKTREE_BACKGROUND_COLOR, resolveNewPagePattern } from "@linktree/types/linktree-defaults.cjs";
import type { BackgroundPatternStyle } from "@linktree/types";
import { parseWebsiteColor } from "@/lib/utils/parse-website-color";
import type { EffectiveAccessManifest } from "@linktree/types";
import { BusinessMessagesPanel } from "@/features/communications/BusinessMessagesPanel";
import { isBusinessSettingsTabLocked } from "@/lib/business-page-access";
import { LockedContent } from "@/components/shared/LockedContent";
import { InlineRequestError } from "@/components/shared/InlineRequestError";
import {
  createUploadFailureError,
  inlineRequestErrorFromResponse,
  localizeInlineRequestError,
  type InlineRequestErrorData,
  validateUploadFile,
} from "@/lib/api/inline-request-error";
import { enqueueImageUpload } from "@/lib/api/enqueue-image-upload";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { BusinessOwnerIdentityFields } from "@/features/link-editor/components/BusinessOwnerIdentityFields";
import { BusinessLanguageDropdown } from "@/features/business/components/BusinessLanguageDropdown";
import { DefaultPageCreationCard } from "@/features/business/components/DefaultPageCreationCard";
import {
  AVATAR_MIME_TYPES,
  FAVICON_MIME_TYPES,
  LOGO_MIME_TYPES,
} from "@/lib/brand/brand-assets";

type Tab = "profile" | "defaults" | "messages";
type SettingsData = {
  name: string;
  username: string;
  phone: string;
  email: string;
  subdomain: string;
  logo: string;
  favicon: string;
  default_avatar: string;
  website_color: string;
  default_template: string;
  default_background_color: string;
  default_background_pattern: BackgroundPatternStyle;
  default_whatsapp_enabled: boolean;
  /**
   * When the profile unlocks again, or null when it is editable. Profile
   * changes apply immediately and then lock for a cooldown period instead of
   * waiting on platform-administrator approval.
   */
  profile_locked_until?: string | null;
  /** Verified owner account, shown read-only. */
  ownerName?: string | null;
};

const emptySettings: SettingsData = {
  name: "",
  username: "",
  phone: "",
  email: "",
  subdomain: "",
  logo: "",
  favicon: "",
  default_avatar: "",
  website_color: "#000000",
  // Mirrors backend/src/common/linktree-defaults.ts. `normalizeSettings`
  // spreads these under the API response, so a field the server omits is shown
  // from here — two different answers to "what is the default" would surface as
  // the form disagreeing with the page it configures.
  default_template: "spectrum",
  default_background_color: DEFAULT_LINKTREE_BACKGROUND_COLOR,
  default_background_pattern: resolveNewPagePattern(undefined),
  default_whatsapp_enabled: false,
};
export function BusinessSettingsPage() {
  const startRequest = useLatestRequest();
  const t = useTranslations("SettingsPage");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() =>
    searchParams.get("tab") === "messages" ? "messages" : "profile",
  );
  const [initialConversationId] = useState(
    () => searchParams.get("conversation") || undefined,
  );

  useEffect(() => {
    if (searchParams.get("tab") || searchParams.get("conversation")) {
      router.replace("/business/settings");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [data, setData] = useState<SettingsData>(emptySettings);
  const [savedSnapshot, setSavedSnapshot] =
    useState<SettingsData>(emptySettings);
  const [brandAssetError, setBrandAssetError] =
    useState<InlineRequestErrorData | null>(null);
  const [settingsAvailable, setSettingsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [effectiveAccess, setEffectiveAccess] =
    useState<EffectiveAccessManifest | null>(null);

  const loadSettings = useCallback(
    async (rethrow = false) => {
      const current = startRequest();
      try {
        const [settingsResponse, accessResponse] = await Promise.all([
          fetch("/api/auth/settings", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/auth/effective-access", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);
        if (!settingsResponse.ok || !accessResponse.ok) {
          throw new Error("Failed to load settings");
        }
        const [settingsResult, accessResult] = await Promise.all([
          settingsResponse.json(),
          accessResponse.json(),
        ]);
        if (!current()) return;
        const normalizedSettings = normalizeSettings(settingsResult.data);
        setSettingsAvailable(true);
        setData(normalizedSettings);
        setSavedSnapshot(normalizedSettings);
        setEffectiveAccess(accessResult.data || null);
      } catch (error) {
        if (!current()) return;
        setSettingsAvailable(false);
        if (rethrow) throw error;
        toast.error(t("loadFailed"));
      }
    },
    [t, startRequest],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSettings().finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSettings]);

  useEffect(() => {
    const syncAccess = (event: Event) => {
      const detail = (event as CustomEvent<EffectiveAccessManifest>).detail;
      if (detail) setEffectiveAccess(detail);
    };
    window.addEventListener("sponsor-krd:access-updated", syncAccess);
    return () =>
      window.removeEventListener("sponsor-krd:access-updated", syncAccess);
  }, []);

  const refreshing = useRegisterDashboardRefresh("business-settings", () => loadSettings(true));

  const save = async () => {
    setSaving(true);
    try {
      // Only send the fields the backend DTO whitelists for the active
      // section. The global pipe rejects unknown properties, so spreading the
      // whole settings object (email, subdomain, …)
      // would 400 every tab.
      let body: Record<string, unknown>;
      if (activeTab === "defaults") {
        body = {
          section: activeTab,
          default_template: data.default_template,
          default_background_color: data.default_background_color,
          default_background_pattern: data.default_background_pattern,
          default_whatsapp_enabled: data.default_whatsapp_enabled,
        };
      } else if (
        effectiveAccess?.permissions["business:profile:update"]?.outcome ===
        "deny"
      ) {
        body = { section: activeTab, username: data.username };
      } else {
        // Send only what actually changed. The backend authorizes the fields
        // present in the payload, and the non-image profile fields are still
        // approval-gated — submitting an untouched `name` alongside a new logo
        // would push the whole save back into the approval queue.
        const profileFields = [
          "name",
          "username",
          "phone",
          "logo",
          "favicon",
          "default_avatar",
          "website_color",
        ] as const;
        const changed = profileFields.filter(
          (field) => data[field] !== savedSnapshot[field],
        );
        body = { section: activeTab };
        for (const field of changed) body[field] = data[field];
      }
      const response = await fetch("/api/auth/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "Save failed");
      if (result?.data) {
        const normalized = normalizeSettings(result.data);
        setData(normalized);
        setSavedSnapshot(normalized);
        window.dispatchEvent(
          new CustomEvent("sponsor-krd:business-settings-updated", {
            detail: normalized,
          }),
        );
      }
      toast.info(activeTab === "profile" ? t("profileSubmitted") : t("saved"));
    } catch (error) {
      toast.error(t("saveFailed"), {
        description:
          locale !== "ckb"
            ? undefined
            : error instanceof Error
              ? error.message
              : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs = useMemo(
    () => [
      { id: "profile" as const, label: t("profileTab"), icon: UserRound },
      {
        id: "defaults" as const,
        label: t("defaultsTab"),
        icon: SlidersHorizontal,
      },
      {
        id: "messages" as const,
        label: t("messagesTab"),
        icon: MessageSquare,
      },
    ],
    [t],
  );
  const activeTab = tabs.some((item) => item.id === tab) ? tab : "profile";
  const tabLocked = isBusinessSettingsTabLocked(activeTab, effectiveAccess);
  // Section save button uses the shared tab save behavior: it stays idle
  // ("پاشەکەوت کرا") until something changed, then flips to a live save.
  // Only user-editable fields count — server-managed response fields would
  // otherwise keep the form permanently dirty after every save.
  const dirty = useMemo(() => {
    return (
      data.name !== savedSnapshot.name ||
      data.username !== savedSnapshot.username ||
      data.phone !== savedSnapshot.phone ||
      data.email !== savedSnapshot.email ||
      data.subdomain !== savedSnapshot.subdomain ||
      data.logo !== savedSnapshot.logo ||
      data.favicon !== savedSnapshot.favicon ||
      data.default_avatar !== savedSnapshot.default_avatar ||
      data.website_color !== savedSnapshot.website_color ||
      data.default_template !== savedSnapshot.default_template ||
      data.default_background_pattern !== savedSnapshot.default_background_pattern ||
      data.default_background_color !==
        savedSnapshot.default_background_color ||
      data.default_whatsapp_enabled !== savedSnapshot.default_whatsapp_enabled
    );
  }, [data, savedSnapshot]);
  const profileEditingOutcome =
    effectiveAccess?.permissions["business:profile:update"]?.outcome;
  const profileEditingAllowed =
    profileEditingOutcome === "allow" || profileEditingOutcome === "approval";
  const usernameEditingOutcome =
    effectiveAccess?.permissions["business:security:username-update"]?.outcome;
  const usernameEditingAllowed =
    usernameEditingOutcome === "allow" || usernameEditingOutcome === "approval";
  const brandingEditingOutcome =
    effectiveAccess?.permissions["business:profile-assets:upload"]?.outcome;
  const brandingEditingAllowed =
    brandingEditingOutcome === "allow" || brandingEditingOutcome === "approval";
  const cooldown = profileCooldown(data.profile_locked_until);
  const uploadBrandAsset = async (
    file: File,
    assetType: "logo" | "favicon" | "default-avatar",
  ) => {
    const allowedMimeTypes =
      assetType === "favicon"
        ? FAVICON_MIME_TYPES
        : assetType === "default-avatar"
          ? AVATAR_MIME_TYPES
          : LOGO_MIME_TYPES;
    const validationError = validateUploadFile(file, {
      allowedMimeTypes,
      maxBytes: 10 * 1024 * 1024,
    });
    if (validationError) {
      setBrandAssetError(validationError);
      return;
    }
    setBrandAssetError(null);
    await enqueueImageUpload(async () => {
      try {
        const form = new FormData();
        form.append("assetType", assetType);
        form.append("file", file);
        const response = await fetch("/api/auth/profile-assets/upload", {
          method: "POST",
          credentials: "include",
          body: form,
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.url) {
          setBrandAssetError(
            response.ok
              ? createUploadFailureError()
              : inlineRequestErrorFromResponse(response),
          );
          return null;
        }
        const key =
          assetType === "default-avatar" ? "default_avatar" : assetType;
        setData((current) =>
          assetType === "logo"
            ? // The favicon follows the logo on every logo upload. A separate
              // favicon upload afterwards still overrides it, until the next
              // logo upload. The default avatar is deliberately left alone — it
              // stands in for a person, not for the brand.
              { ...current, logo: result.url, favicon: result.url }
            : { ...current, [key]: result.url },
        );
        return result.url;
      } catch {
        setBrandAssetError(createUploadFailureError());
        return null;
      }
    });
  };

  return (
    <section
      className="relative w-full space-y-5 pb-10 dark:[color-scheme:dark]"
      dir="ltr"
    >
      <StatCardGrid className="mb-8">
        <StatCard
          loading={loading || refreshing}
          loadingLabel={t("loadingSettings")}
          icon={SlidersHorizontal}
          label={t("tabsCount")}
          value={tabs.length}
          color="blue"
        />
        <StatCard
          loading={loading || refreshing}
          loadingLabel={t("loadingSettings")}
          icon={Building2}
          label={t("businessName")}
          value={settingsAvailable ? data.name || "—" : "—"}
          color="green"
        />
        <StatCard
          loading={loading || refreshing}
          loadingLabel={t("loadingSettings")}
          icon={Palette}
          label={t("defaultTemplate")}
          value={settingsAvailable ? (TEMPLATE_OPTIONS.find((item) => item.id === data.default_template)?.name ?? data.default_template) || "—" : "—"}
          color="purple"
        />
        <StatCard
          loading={loading || refreshing}
          loadingLabel={t("loadingSettings")}
          icon={ShieldCheck}
          label={t("profileEditing")}
          value={settingsAvailable ? cooldown || !profileEditingAllowed ? t("locked") : t("active") : "—"}
          color={settingsAvailable && (cooldown || !profileEditingAllowed) ? "orange" : "green"}
        />
      </StatCardGrid>
      {loading ? <SkeletonSettingsPage showStats={false} tabCount={tabs.length} loadingLabel={t("loadingSettings")} /> : !settingsAvailable ? <RequestErrorNotice message={t("loadFailed")} /> : <>
      <SegmentedTabs tabs={tabs} value={activeTab} onChange={setTab} />
      <PageManagementSection
        title={tabs.find((item) => item.id === activeTab)!.label}
        description={activeTab === "profile" ? t("profileDescription") : activeTab === "defaults" ? t("defaultsDescription") : t("messagesDescription")}
        icon={activeTab === "profile" ? <Building2 className="size-5" /> : activeTab === "defaults" ? <Palette className="size-5" /> : <MessageSquare className="size-5" />}
      >
        <DashboardRefreshRegion loading={refreshing} label={t("loadingSettings")}>
        <LockedContent
          locked={tabLocked}
          icon={ShieldCheck}
          title={t("lockedTitle")}
          description={t("upgradeRequired")}
        >
            {activeTab === "profile" && (
              <div className="grid gap-5 sm:grid-cols-2">
                {cooldown && (
                  <div className="col-span-full flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    <Clock3 className="h-4 w-4" />
                    <span>
                      {t("brandCooldownBefore")}{" "}
                      {cooldown.until.toLocaleDateString(
                        locale === "ar"
                          ? "ar-IQ"
                          : locale === "en"
                            ? "en-IQ"
                            : "ckb-IQ",
                      )}{" "}
                      ({t("daysRemaining", { count: cooldown.daysLeft })})
                    </span>
                  </div>
                )}
                <div className="col-span-full">
                  <BusinessBrandingFields
                    data={data}
                    onUpload={uploadBrandAsset}
                    enabled={brandingEditingAllowed && !cooldown}
                  />
                  {brandAssetError && (
                    <InlineRequestError
                      className="mx-auto mt-3 max-w-xl"
                      error={localizeInlineRequestError(
                        brandAssetError,
                        locale === "ar" ? "ar" : locale === "en" ? "en" : "ckb",
                      )}
                    />
                  )}
                  <div className="mt-3 flex justify-center">
                    <Tooltip content={t("changeWebsiteColor")} side="bottom">
                      <button
                        type="button"
                        onClick={() => setShowColorPicker(true)}
                        disabled={!profileEditingAllowed || Boolean(cooldown)}
                        className={`${SHARED_SOFT_BUTTON_CLASS} inline-flex h-10 items-center justify-center gap-2 px-3.5 text-xs font-semibold`}
                      >
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm"
                          style={{
                            background: parseWebsiteColor(data.website_color)
                              .css,
                          }}
                        >
                          <Palette className="h-3.5 w-3.5" />
                        </span>
                        <span>{t("websiteColor")}</span>
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <div className="col-span-full">
                  <BusinessOwnerIdentityFields
                    ownerName={data.ownerName}
                    ownerEmail={data.email}
                    copy={{
                      accountName: t("accountName"),
                      fromVerified: t("fromVerified"),
                      email: t("email"),
                      verified: t("verified"),
                      unverified: t("unverified"),
                      unavailable: t("unavailable"),
                      verifiedEmail: t("verifiedEmail"),
                    }}
                  />
                </div>
                <Field label={t("businessName")}>
                  <input
                    className={inputClass}
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    placeholder={t("businessName")}
                    disabled={!profileEditingAllowed || Boolean(cooldown)}
                  />
                </Field>
                <Field label={t("mobileNumber")}>
                  <input
                    className={inputClass}
                    value={data.phone || ""}
                    onChange={(e) =>
                      setData({ ...data, phone: e.target.value })
                    }
                    placeholder={t("mobileNumber")}
                    disabled={!profileEditingAllowed || Boolean(cooldown)}
                  />
                </Field>
                <Field label={t("username")}>
                  <input
                    className={`${inputClass} ${usernameEditingAllowed ? "" : "opacity-70"}`}
                    value={data.username}
                    onChange={(e) =>
                      setData({ ...data, username: e.target.value })
                    }
                    readOnly={!usernameEditingAllowed}
                    placeholder={t("username")}
                  />
                </Field>
                <Field label={t("subdomain")}>
                  <input
                    className={`${inputClass} opacity-70`}
                    value={data.subdomain}
                    readOnly
                    placeholder={t("subdomain")}
                  />
                </Field>
              </div>
            )}

            {activeTab === "defaults" && (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="col-span-full">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <BusinessLanguageDropdown />
                      </div>
                      <div className="sm:col-span-2">
                        <LinktreeDefaultAppearanceFields locale={locale === "en" ? "en" : locale === "ar" ? "ar" : "ckb"}
                          template={data.default_template} color={data.default_background_color} pattern={data.default_background_pattern}
                          onTemplateChange={(value) => setData((current) => ({ ...current, default_template: value }))}
                          onColorChange={(value) => setData((current) => ({ ...current, default_background_color: value }))}
                          onPatternChange={(value) => setData((current) => ({ ...current, default_background_pattern: value }))} />
                      </div>
                      <VisibilitySwitch
                        stateLabel={t("enableWhatsapp")}
                        label={t("enableWhatsapp")}
                        checked={data.default_whatsapp_enabled}
                        onChange={(value) =>
                          setData({ ...data, default_whatsapp_enabled: value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <DefaultPageCreationCard />
              </>
            )}

            {activeTab === "messages" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="col-span-full">
                  <BusinessMessagesPanel
                    initialConversationId={initialConversationId}
                  />
                </div>
              </div>
            )}
        </LockedContent>
        </DashboardRefreshRegion>
        {activeTab !== "messages" && (
          <SectionSaveActions>
            <TabSaveButton
              copy={{
                savingTooltip: t("savingTooltip"),
                saveTooltip: t("saveTooltip"),
                unchangedTooltip: t("unchangedTooltip"),
                saving: t("saving"),
                save: t("save"),
                saved: t("savedButton"),
              }}
              dirty={dirty}
              saving={saving}
              disabled={tabLocked || refreshing}
              accent
              onSave={() => void save()}
            />
          </SectionSaveActions>
        )}
      </PageManagementSection></>}
        <ColorGradientModal
          isOpen={showColorPicker}
          copy={
            locale === "ar"
              ? businessMessages.ar.SettingsColorPicker
              : locale === "en"
                ? businessMessages.en.SettingsColorPicker
                : undefined
          }
          value={data.website_color}
          onChange={(value) =>
            setData((current) => ({ ...current, website_color: value }))
          }
          onClose={() => setShowColorPicker(false)}
          solidFallback="#000000"
          gradientFallback="#0066ff"
        />

    </section>
  );
}
function normalizeSettings(
  value: Partial<SettingsData> | null | undefined,
): SettingsData {
  const raw = value || {};
  return {
    ...emptySettings,
    ...raw,
    default_background_color: raw.default_background_color || DEFAULT_LINKTREE_BACKGROUND_COLOR,
    default_background_pattern: resolveNewPagePattern(raw.default_background_pattern),
    profile_locked_until: raw.profile_locked_until ?? null,
    ownerName: raw.ownerName ?? null,
  };
}

/**
 * Remaining profile cooldown, or null when the profile can be changed.
 * A past or unparseable timestamp reads as unlocked — the backend enforces the
 * window regardless, so the UI failing open only costs a rejected save.
 */
function profileCooldown(
  lockedUntil: string | null | undefined,
): { until: Date; daysLeft: number } | null {
  if (!lockedUntil) return null;
  const until = new Date(lockedUntil);
  if (Number.isNaN(until.getTime()) || until.getTime() <= Date.now())
    return null;
  return {
    until,
    daysLeft: Math.ceil((until.getTime() - Date.now()) / 86_400_000),
  };
}

