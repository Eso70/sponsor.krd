"use client";

import { useCallback } from "react";
import { useRegisterBusinessDashboardRefresh } from "@/features/business/dashboard-refresh";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useBusinessLocale } from "@/features/business/i18n/BusinessLocaleProvider";
import { businessMessages } from "@/features/business/i18n/messages";
import type { CommunicationNotification } from "./types";
import { NotificationBell } from "./NotificationBell";
import {
  isSafeNotificationActionUrl,
} from "./notification-action";
import { useNotificationInbox } from "./useNotificationInbox";

const BUSINESS_COMMUNICATIONS_ENDPOINT = "/api/auth/communications";

function canOpenBusinessNotification(notification: CommunicationNotification) {
  return Boolean(
    (notification.sourceType === "conversation" && notification.sourceId) ||
    isSafeNotificationActionUrl(notification.actionUrl),
  );
}

export function BusinessCommunicationBell() {
  const { color: businessTheme } = useTheme();
  const { locale } = useBusinessLocale();
  const copy = businessMessages[locale].Notifications;
  const notifications = useNotificationInbox(BUSINESS_COMMUNICATIONS_ENDPOINT, copy);

  useRegisterBusinessDashboardRefresh("notifications", () =>
    notifications.load(true),
  );

  const openAction = useCallback((notification: CommunicationNotification) => {
    if (notification.sourceType === "conversation" && notification.sourceId) {
      window.location.assign(
        `/business/settings?tab=messages&conversation=${encodeURIComponent(notification.sourceId)}`,
      );
      return;
    }
    if (
      isSafeNotificationActionUrl(notification.actionUrl) &&
      notification.actionUrl.startsWith("/")
    ) {
      window.location.assign(notification.actionUrl);
      return;
    }
    if (isSafeNotificationActionUrl(notification.actionUrl)) {
      window.open(notification.actionUrl, "_blank", "noopener,noreferrer");
    }
  }, []);

  return (
    <NotificationBell
      copy={copy}
      dateLocale={locale === "ar" ? "ar-IQ" : locale === "en" ? "en-US" : "ckb-IQ"}
      inbox={notifications.inbox}
      loading={notifications.loading}
      onRefresh={notifications.load}
      onRead={notifications.read}
      onDismiss={notifications.dismiss}
      onMarkAllRead={notifications.markAllRead}
      onDeleteAll={notifications.deleteAll}
      modalDescription={copy.description}
      modalAccentColor={businessTheme.primary}
      sponsorKrdModalTheme={false}
      canOpenAction={canOpenBusinessNotification}
      onOpenAction={openAction}
      actionLabel={(notification) => notification.sourceType === "conversation" ? copy.reply : copy.view}
    />
  );
}
