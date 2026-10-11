"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { businessMessages } from "@/features/business/i18n/messages";
import Image from "next/image";
import {
  Building2,
  Clock3,
  MessageSquare,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { ColorGradientModal } from "@/components/shared/ColorGradientModal";
import { PageHeaderSection } from "@/components/shared/PageHeaderSection";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { TabSaveButton } from "@/components/shared/TabSaveButton";
import { Tooltip } from "@/components/shared/Tooltip";
import { StatCard } from "@/components/shared/StatCard";
import { SkeletonSettingsPage } from "@/components/shared/SkeletonPageLayouts";
import { TemplateCombobox } from "@/components/ui/TemplateCombobox";
import { parseWebsiteColor } from "@/lib/utils/parse-website-color";
import type { EffectiveAccessManifest } from "@linktree/types";
import { SessionManagementPanel } from "@/components/shared/SessionManagementPanel";
import { BusinessMessagesPanel } from "@/features/communications/BusinessMessagesPanel";
import { isBusinessSettingsTabLocked } from "@/lib/business-page-access";
import { DashboardSurface } from "@/components/shared/DashboardSurface";
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
  AVATAR_ACCEPT,
  AVATAR_MIME_TYPES,
  BUSINESS_FAVICON_PLACEHOLDER,
  BUSINESS_LOGO_PLACEHOLDER,
  DEFAULT_AVATAR,
  FAVICON_ACCEPT,
  FAVICON_MIME_TYPES,
  LOGO_ACCEPT,
  LOGO_MIME_TYPES,
} from "@/lib/brand/brand-assets";

type Tab = "profile" | "defaults" | "security" | "messages";
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
  default_footer_text: string;
  default_footer_phone: string;
  default_template: string;
  default_background_color: string;
  default_footer_hidden: boolean;
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
  default_footer_text: "",
  default_footer_phone: "",
  // Mirrors backend/src/common/linktree-defaults.ts. `normalizeSettings`
  // spreads these under the API response, so a field the server omits is shown
  // from here — two different answers to "what is the default" would surface as
  // the form disagreeing with the page it configures.
  default_template: "spectrum",
  default_background_color: "#ffffff",
  default_footer_hidden: true,
  default_whatsapp_enabled: false,
};
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-2 dark:border-white/10 dark:bg-[#161B22] dark:text-slate-200 dark:placeholder:text-slate-500 dark:[color-scheme:dark]";

export function BusinessSettingsPage() {
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDefaultColorPicker, setShowDefaultColorPicker] = useState(false);
  const [effectiveAccess, setEffectiveAccess] =
    useState<EffectiveAccessManifest | null>(null);

  const loadSettings = useCallback(
    async (rethrow = false) => {
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
        const normalizedSettings = normalizeSettings(settingsResult.data);
        setData(normalizedSettings);
        setSavedSnapshot(normalizedSettings);
        setEffectiveAccess(accessResult.data || null);
      } catch (error) {
        if (rethrow) throw error;
        toast.error(t("loadFailed"));
      }
    },
    [t],
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
          default_footer_text: data.default_footer_text,
          default_footer_phone: data.default_footer_phone,
          default_template: data.default_template,
          default_background_color: data.default_background_color,
          default_footer_hidden: data.default_footer_hidden,
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
        id: "security" as const,
        label: t("securityTab"),
        icon: ShieldCheck,
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
  // Header save button matches the advertising page tabs: it stays idle
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
      data.default_footer_text !== savedSnapshot.default_footer_text ||
      data.default_footer_phone !== savedSnapshot.default_footer_phone ||
      data.default_template !== savedSnapshot.default_template ||
      data.default_background_color !==
        savedSnapshot.default_background_color ||
      data.default_footer_hidden !== savedSnapshot.default_footer_hidden ||
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

  if (loading)
    return (
      <SkeletonSettingsPage
        tabCount={tabs.length}
        loadingLabel={t("loadingSettings")}
      />
    );

  return (
    <section
      className="relative w-full space-y-5 pb-10 dark:[color-scheme:dark]"
      dir="ltr"
    >
      <StatCardGrid className="mb-5">
        <StatCard
          icon={SlidersHorizontal}
          label={t("tabsCount")}
          value="4"
          color="blue"
        />
        <StatCard
          icon={Building2}
          label={t("businessName")}
          value={data.name || "—"}
          color="green"
        />
        <StatCard
          icon={Palette}
          label={t("defaultTemplate")}
          value={data.default_template || "—"}
          color="purple"
        />
        <StatCard
          icon={ShieldCheck}
          label={t("accountStatus")}
          value={cooldown ? t("locked") : t("active")}
          color={cooldown ? "orange" : "green"}
        />
      </StatCardGrid>
      <div>
        <div className="mb-4">
          <SegmentedTabs tabs={tabs} value={activeTab} onChange={setTab} />
        </div>

        <LockedContent
          locked={tabLocked}
          icon={ShieldCheck}
          title={t("lockedTitle")}
          description={t("upgradeRequired")}
        >
          <DashboardSurface>
            {activeTab === "profile" && (
              <PageHeaderSection
                icon={Building2}
                title={t("profileTab")}
                description={t("profileDescription")}
                action={
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
                    disabled={tabLocked}
                    accent
                    onSave={() => void save()}
                  />
                }
              >
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
                  <BrandImageStack
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
                        className="group inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-white hover:text-gray-800 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-gray-100 cursor-pointer"
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
                    placeholder="+964 7XX XXX XXXX"
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
              </PageHeaderSection>
            )}

            {activeTab === "defaults" && (
              <>
                <PageHeaderSection
                  icon={Palette}
                  title={t("defaultsTab")}
                  description={t("defaultsDescription")}
                  action={
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
                      disabled={tabLocked}
                      accent
                      onSave={() => void save()}
                    />
                  }
                >
                  <div className="col-span-full rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <BusinessLanguageDropdown />
                      </div>
                      <Field label={t("defaultTemplate")}>
                        <TemplateCombobox
                          copy={
                            locale === "ar"
                              ? businessMessages.ar.SettingsTemplates
                              : locale === "en"
                                ? businessMessages.en.SettingsTemplates
                                : undefined
                          }
                          value={data.default_template}
                          onChange={(value) =>
                            setData({ ...data, default_template: value })
                          }
                        />
                      </Field>
                      <Field label={t("backgroundColor")}>
                        <Tooltip
                          content={t("chooseBackgroundColor")}
                          side="top"
                        >
                          <button
                            type="button"
                            onClick={() => setShowDefaultColorPicker(true)}
                            className={`${inputClass} flex items-center justify-between gap-3 cursor-pointer`}
                          >
                            <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {data.default_background_color ||
                                t("backgroundColor")}
                            </span>
                            <span
                              className="h-5 w-5 shrink-0 rounded border-2 border-white shadow-sm ring-1 ring-slate-200 dark:border-[#161B22] dark:ring-white/10"
                              style={{
                                background: parseWebsiteColor(
                                  data.default_background_color || "#000000",
                                ).css,
                              }}
                            />
                          </button>
                        </Tooltip>
                      </Field>
                      <Field label={t("footerText")}>
                        <input
                          className={inputClass}
                          value={data.default_footer_text || ""}
                          onChange={(e) =>
                            setData({
                              ...data,
                              default_footer_text: e.target.value,
                            })
                          }
                          placeholder={t("defaultFooterText")}
                        />
                      </Field>
                      <Field label={t("footerPhone")}>
                        <input
                          className={inputClass}
                          value={data.default_footer_phone || ""}
                          onChange={(e) =>
                            setData({
                              ...data,
                              default_footer_phone: e.target.value,
                            })
                          }
                          placeholder="+964 7XX XXX XXXX"
                        />
                      </Field>
                      <Toggle
                        label={t("hideFooter")}
                        checked={data.default_footer_hidden}
                        onChange={(value) =>
                          setData({ ...data, default_footer_hidden: value })
                        }
                      />
                      <Toggle
                        label={t("enableWhatsapp")}
                        checked={data.default_whatsapp_enabled}
                        onChange={(value) =>
                          setData({ ...data, default_whatsapp_enabled: value })
                        }
                      />
                    </div>
                  </div>
                </PageHeaderSection>
                <DefaultPageCreationCard />
              </>
            )}

            {activeTab === "security" && (
              <PageHeaderSection
                icon={ShieldCheck}
                title={t("securityTitle")}
                description={t("securityDescription")}
              >
                <div className="col-span-full rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                  {t("ownerEmail")}: <strong>{data.email}</strong>.{" "}
                  {t("newLoginClosesSession")}
                </div>
                <SessionManagementPanel
                  endpoint="/api/auth/sessions"
                  copy={
                    locale === "ar"
                      ? businessMessages.ar.SettingsSessions
                      : locale === "en"
                        ? businessMessages.en.SettingsSessions
                        : undefined
                  }
                  dateLocale={
                    locale === "ar"
                      ? "ar-IQ"
                      : locale === "en"
                        ? "en-US"
                        : undefined
                  }
                />
              </PageHeaderSection>
            )}

            {activeTab === "messages" && (
              <PageHeaderSection
                icon={MessageSquare}
                title={t("messagesTab")}
                description={t("messagesDescription")}
              >
                <div className="col-span-full">
                  <BusinessMessagesPanel
                    initialConversationId={initialConversationId}
                  />
                </div>
              </PageHeaderSection>
            )}
          </DashboardSurface>
        </LockedContent>
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
        <ColorGradientModal
          isOpen={showDefaultColorPicker}
          copy={
            locale === "ar"
              ? businessMessages.ar.SettingsColorPicker
              : locale === "en"
                ? businessMessages.en.SettingsColorPicker
                : undefined
          }
          value={data.default_background_color}
          onChange={(value) =>
            setData((current) => ({
              ...current,
              default_background_color: value,
            }))
          }
          onClose={() => setShowDefaultColorPicker(false)}
          solidFallback="#000000"
          gradientFallback="#0066ff"
        />
      </div>
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

function BrandImageStack({
  data,
  onUpload,
  enabled,
}: {
  data: SettingsData;
  onUpload: (file: File, type: "logo" | "favicon" | "default-avatar") => void;
  enabled: boolean;
}) {
  const t = useTranslations("SettingsPage");
  return (
    <div
      className={`flex flex-col items-center gap-1 py-1 ${
        enabled ? "" : "pointer-events-none opacity-60"
      }`}
    >
      <div className="relative h-44 w-72 sm:h-48 sm:w-80">
        <Tooltip content={t("changeAvatar")} side="top">
          <label className="group absolute left-5 top-7 z-30 h-24 w-24 rotate-[-8deg] cursor-pointer overflow-hidden rounded-full border-4 border-white bg-white shadow-xl ring-1 ring-gray-200 transition hover:rotate-0 hover:scale-105 dark:border-[#161B22] dark:bg-[#161B22] dark:ring-white/10">
            <Image
              src={data.default_avatar || DEFAULT_AVATAR}
              alt={t("avatar")}
              width={112}
              height={112}
              className="h-full w-full object-cover"
            />
            <UploadOverlay label={t("avatar")} />
            <input
              type="file"
              accept={AVATAR_ACCEPT}
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] &&
                onUpload(e.target.files[0], "default-avatar")
              }
            />
          </label>
        </Tooltip>
        <Tooltip content={t("changeFavicon")} side="top">
          <label className="group absolute right-6 top-4 z-30 h-20 w-20 rotate-[10deg] cursor-pointer overflow-hidden rounded-2xl border-4 border-white bg-white p-2 shadow-lg ring-1 ring-gray-200 transition hover:rotate-0 hover:scale-105 dark:border-[#161B22] dark:bg-[#161B22] dark:ring-white/10">
            <Image
              src={data.favicon || BUSINESS_FAVICON_PLACEHOLDER}
              alt={t("favicon")}
              width={96}
              height={96}
              className="h-full w-full object-contain"
            />
            <UploadOverlay label={t("favicon")} />
            <input
              type="file"
              accept={FAVICON_ACCEPT}
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && onUpload(e.target.files[0], "favicon")
              }
            />
          </label>
        </Tooltip>
        <Tooltip content={t("changeLogo")} side="top">
          <label className="group absolute left-1/2 top-12 z-20 h-32 w-32 -translate-x-1/2 cursor-pointer overflow-hidden rounded-3xl border-4 border-white bg-white p-3 shadow-2xl ring-1 ring-gray-200 transition hover:scale-105 dark:border-[#161B22] dark:bg-[#161B22] dark:ring-white/10">
            <Image
              src={data.logo || BUSINESS_LOGO_PLACEHOLDER}
              alt={t("logo")}
              width={144}
              height={144}
              className="h-full w-full object-contain"
            />
            <UploadOverlay label={t("logo")} />
            <input
              type="file"
              accept={LOGO_ACCEPT}
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && onUpload(e.target.files[0], "logo")
              }
            />
          </label>
        </Tooltip>
      </div>
      <div className="-mt-2 flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-gray-500 shadow-sm dark:border-white/10 dark:bg-[#161B22]/90 dark:text-gray-300">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: "var(--theme-primary)" }}
        />
        {t("logo")}
        <span>·</span>
        {t("avatar")}
        <span>·</span>
        {t("favicon")}
      </div>
    </div>
  );
}
function UploadOverlay({ label }: { label: string }) {
  return (
    <>
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
        <Upload className="h-5 w-5" />
      </span>
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-2 py-0.5 text-[9px] text-white">
        {label}
      </span>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </span>
      {children}
    </label>
  );
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex h-12 items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-[#161B22] dark:text-slate-300"
    >
      <span>{label}</span>
      <span
        className={`relative h-6 w-11 rounded-full transition ${checked ? "" : "bg-slate-200 dark:bg-slate-700"}`}
        style={checked ? { background: "var(--theme-css)" } : undefined}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full shadow transition ${checked ? "left-6" : "left-1 bg-white"}`}
          style={checked ? { background: "var(--theme-ink)" } : undefined}
        />
      </span>
    </button>
  );
}
