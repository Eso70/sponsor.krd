"use client";
import { CalendarClock, Ban, Trash2, Plus } from "lucide-react";
import { AnalyticsShareActionButton } from "./AnalyticsShareActionButton";
import {
  LanguageToggle,
  nextLanguageLocale,
} from "@/components/shared/LanguageToggle";
import { ThemeToggleButton } from "@/components/shared/ThemeToggleButton";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { AnalyticsShareLink } from "@linktree/types";
import { ManagementDrawer } from "@/components/shared/ManagementDrawer";
import { EditorSection } from "@/components/shared/EditorSection";
import { ModalStepActions } from "@/components/shared/ModalStepActions";
import { VisibilitySwitch } from "@/components/shared/VisibilitySwitch";
import { ShareExpiryField, expiryInput } from "./ShareExpiryField";
import { AnalyticsShareCredentials } from "./AnalyticsShareCredentials";
import { Skeleton } from "@/components/shared/Skeleton";
import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { apiRequest } from "@/lib/api/request";
import { sharingCopy, type SharingLocale } from "../sharing-copy";

export function AnalyticsShareDrawer({
  apiBase,
  locale: initialLocale,
  onClose,
  accentColor,
  platformTheme = false,
  pageType = "linktree",
  headerControls,
}: {
  apiBase: string;
  locale: SharingLocale;
  onClose: () => void;
  accentColor?: string | null;
  platformTheme?: boolean;
  pageType?: "form" | "linktree";
  headerControls?: ReactNode;
}) {
  const [selectedLocale, setSelectedLocale] = useState<SharingLocale | null>(
    null,
  );
  const locale = selectedLocale ?? initialLocale;
  const copy = sharingCopy(locale);
  const [includeSubmissions, setIncludeSubmissions] = useState(
    pageType === "form",
  );
  const [createOpen, setCreateOpen] = useState(true);
  const [collapsedLinks, setCollapsedLinks] = useState<string[]>([]);
  const [links, setLinks] = useState<AnalyticsShareLink[]>([]);
  const [expiry, setExpiry] = useState("never");
  const [date, setDate] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editExpiry, setEditExpiry] = useState("never");
  const [editDate, setEditDate] = useState("");
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true),
    [failed, setFailed] = useState(false),
    [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now);
  const lock = useRef(false);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    void apiRequest<AnalyticsShareLink[]>(apiBase, { signal: abort.signal })
      .then(setLinks)
      .catch(() => {
        if (!abort.signal.aborted) setFailed(true);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [apiBase]);
  async function run(operation: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setFailed(false);
    try {
      await operation();
    } catch {
      setFailed(true);
      toast.error(copy.failed);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function copyValue(value: string) {
    if (await copyToClipboard(value)) toast.success(copy.copied);
    else toast.error(copy.failed);
  }
  const button = `${SHARED_SOFT_BUTTON_CLASS} min-h-9 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50`;
  return (
    <ManagementDrawer
      isOpen
      onClose={onClose}
      title={copy.title}
      description={copy.privacy}
      closeLabel={copy.close}
      busy={busy}
      wide
      compactHeader
      headerAction={
        headerControls ?? (
          <>
            <LanguageToggle
              size="compact"
              locale={locale}
              label={
                locale === "ckb"
                  ? "گۆڕینی زمان"
                  : locale === "ar"
                    ? "تغيير اللغة"
                    : "Change language"
              }
              onClick={() => setSelectedLocale(nextLanguageLocale(locale))}
            />
            <ThemeToggleButton
              compact
              copy={{ label: copy.theme, light: copy.light, dark: copy.dark }}
            />
          </>
        )
      }
      createBusinessStyle
      sponsorKrdTheme={platformTheme}
      accentColor={platformTheme ? null : accentColor}
      footer={
        <ModalStepActions
          primaryLabel={copy.close}
          primaryDisabled={busy}
          onPrimary={onClose}
        />
      }
    >
      <div className="space-y-5" dir={locale === "en" ? "ltr" : "rtl"}>
        <EditorSection
          title={copy.share}
          open={createOpen}
          onToggle={() => setCreateOpen((open) => !open)}
        >
          {pageType === "form" && (
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">{copy.includeResponses}</p>
                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {copy.responseNotice}
                </p>
              </div>
              <VisibilitySwitch
                compact
                checked={includeSubmissions}
                onChange={setIncludeSubmissions}
                label={copy.includeResponses}
              />
            </div>
          )}
          <ShareExpiryField
            value={expiry}
            date={date}
            onChange={setExpiry}
            onDateChange={setDate}
            locale={locale}
            disabled={busy || loading}
            action={
              <button
                className={`${SHARED_SOFT_BUTTON_CLASS} theme-fill inline-flex gap-2 h-10 w-full shrink-0 items-center justify-center rounded-lg px-4 text-xs font-semibold disabled:opacity-50 sm:w-auto`}
                disabled={
                  busy ||
                  loading ||
                  links.length >= 20 ||
                  (expiry === "custom" && !date)
                }
                onClick={() =>
                  void run(async () => {
                    const link = await apiRequest<
                      AnalyticsShareLink & { code: string }
                    >(apiBase, {
                      method: "POST",
                      json: {
                        ...expiryInput(expiry, date, locale),
                        ...(pageType === "form" ? { includeSubmissions } : {}),
                      },
                    });
                    const { code, ...saved } = link;
                    setCodes((items) => ({ ...items, [link.id]: code }));
                    setLinks((items) => [saved, ...items]);
                    toast.success(copy.created);
                  })
                }
              >
                <Plus aria-hidden className="size-4" />
                {copy.create}
              </button>
            }
          />
        </EditorSection>
        {failed && (
          <div role="alert" className="space-y-2 text-sm text-red-500">
            <p>{copy.failed}</p>
            <button
              className={button}
              disabled={busy}
              onClick={() =>
                void run(async () =>
                  setLinks(await apiRequest<AnalyticsShareLink[]>(apiBase)),
                )
              }
            >
              {copy.retry}
            </button>
          </div>
        )}
        {loading ? (
          <div role="status" aria-label={copy.loading} className="space-y-3">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="space-y-4 rounded-2xl border border-slate-200/60 p-4 dark:border-white/[0.06]"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-3 w-36" />
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((action) => (
                    <Skeleton
                      key={action}
                      className="size-9 shrink-0 sm:w-20"
                      rounded="rounded-xl"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : !links.length ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {copy.empty}
          </p>
        ) : (
          links.map((link) => {
            const expired =
              !!link.expiresAt && new Date(link.expiresAt).getTime() <= now;
            return (
              <EditorSection
                key={link.id}
                title={
                  link.disabled
                    ? copy.disabled
                    : expired
                      ? copy.expired
                      : copy.active
                }
                open={!collapsedLinks.includes(link.id)}
                onToggle={() =>
                  setCollapsedLinks((items) =>
                    items.includes(link.id)
                      ? items.filter((id) => id !== link.id)
                      : [...items, link.id],
                  )
                }
              >
                <AnalyticsShareCredentials
                  link={link}
                  code={codes[link.id]}
                  locale={locale}
                  busy={busy}
                  revealAllowed={!link.disabled && !expired}
                  onCopy={(value) => void copyValue(value)}
                  onHide={() =>
                    setCodes((items) => {
                      const next = { ...items };
                      delete next[link.id];
                      return next;
                    })
                  }
                  onReveal={() =>
                    void run(async () => {
                      const result = await apiRequest<{ code: string }>(
                        `${apiBase}/${link.id}/code`,
                        { method: "POST" },
                      );
                      setCodes((items) => ({
                        ...items,
                        [link.id]: result.code,
                      }));
                      setLinks((items) =>
                        items.map((item) =>
                          item.id === link.id
                            ? { ...item, canRevealCode: false }
                            : item,
                        ),
                      );
                    })
                  }
                  details={
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <p className="text-xs text-slate-500">
                        {link.includeSubmissions
                          ? copy.responsesIncluded
                          : copy.analyticsOnly}
                      </p>
                      <p className="text-xs text-slate-500">
                        {link.expiresAt
                          ? `${copy.expires}: ${new Date(link.expiresAt).toLocaleString(locale === "ckb" ? "en" : locale)}`
                          : copy.never}
                      </p>
                    </div>
                  }
                  actions={
                    <>
                      <AnalyticsShareActionButton
                        icon={CalendarClock}
                        label={copy.editExpiry}
                        disabled={busy || link.disabled}
                        onClick={() => {
                          setEditing(link.id);
                          setEditExpiry(link.expiresAt ? "custom" : "never");
                          const value = link.expiresAt
                            ? new Date(link.expiresAt)
                            : null;
                          setEditDate(
                            value
                              ? new Date(
                                  value.getTime() -
                                    value.getTimezoneOffset() * 60_000,
                                )
                                  .toISOString()
                                  .slice(0, 16)
                              : "",
                          );
                        }}
                      />
                      <AnalyticsShareActionButton
                        icon={Ban}
                        label={copy.disable}
                        tone="warning"
                        disabled={busy || link.disabled || expired}
                        onClick={() =>
                          void run(async () => {
                            await apiRequest(`${apiBase}/${link.id}/disable`, {
                              method: "POST",
                            });
                            setLinks((items) =>
                              items.map((item) =>
                                item.id === link.id
                                  ? {
                                      ...item,
                                      disabled: true,
                                      canRevealCode: false,
                                    }
                                  : item,
                              ),
                            );
                            setCodes((items) => {
                              const next = { ...items };
                              delete next[link.id];
                              return next;
                            });
                            toast.success(copy.revoked);
                          })
                        }
                      />
                      <AnalyticsShareActionButton
                        icon={Trash2}
                        label={copy.remove}
                        tone="danger"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await apiRequest(`${apiBase}/${link.id}`, {
                              method: "DELETE",
                            });
                            setLinks((items) =>
                              items.filter((item) => item.id !== link.id),
                            );
                            setCodes((items) => {
                              const next = { ...items };
                              delete next[link.id];
                              return next;
                            });
                            toast.success(copy.revoked);
                          })
                        }
                      />
                    </>
                  }
                />
                {editing === link.id && (
                  <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-white/10">
                    <ShareExpiryField
                      value={editExpiry}
                      date={editDate}
                      onChange={setEditExpiry}
                      onDateChange={setEditDate}
                      locale={locale}
                      disabled={busy}
                    />
                    <div className="flex gap-2">
                      <button
                        className={`${button} theme-fill`}
                        disabled={
                          busy || (editExpiry === "custom" && !editDate)
                        }
                        onClick={() =>
                          void run(async () => {
                            const updated =
                              await apiRequest<AnalyticsShareLink>(
                                `${apiBase}/${link.id}/expiry`,
                                {
                                  method: "POST",
                                  json: expiryInput(
                                    editExpiry,
                                    editDate,
                                    locale,
                                  ),
                                },
                              );
                            setLinks((items) =>
                              items.map((item) =>
                                item.id === link.id ? updated : item,
                              ),
                            );
                            setEditing(null);
                            toast.success(copy.updated);
                          })
                        }
                      >
                        {copy.save}
                      </button>
                      <button
                        className={button}
                        disabled={busy}
                        onClick={() => setEditing(null)}
                      >
                        {copy.cancel}
                      </button>
                    </div>
                  </div>
                )}
              </EditorSection>
            );
          })
        )}
      </div>
    </ManagementDrawer>
  );
}
