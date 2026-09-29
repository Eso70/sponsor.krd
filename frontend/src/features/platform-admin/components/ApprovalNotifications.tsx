"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { NotificationBell } from "@/features/communications/NotificationBell";
import {
  isSafeNotificationActionUrl,
  notificationActionLabel,
} from "@/features/communications/notification-action";
import type { CommunicationNotification } from "@/features/communications/types";
import { useNotificationInbox } from "@/features/communications/useNotificationInbox";
import { usePolling } from "@/lib/utils/usePolling";
import {
  PendingApprovalNotifications,
  type ApprovalNotification,
} from "./PendingApprovalNotifications";
import { useSettingsText } from "./use-settings-text";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";

const PLATFORM_COMMUNICATIONS_ENDPOINT = "/api/platform/communications";

function canOpenPlatformNotification(notification: CommunicationNotification) {
  return isSafeNotificationActionUrl(notification.actionUrl);
}

function platformNotificationDestination(actionUrl: string) {
  if (actionUrl.startsWith("https://")) return actionUrl;
  const consoleBasePath = `/${window.location.pathname.split("/").filter(Boolean)[0]}`;
  return actionUrl.startsWith(consoleBasePath)
    ? actionUrl
    : `${consoleBasePath}${actionUrl}`;
}

export interface ApprovalNotificationsHandle {
  refresh: () => Promise<unknown>;
}

export const ApprovalNotifications = forwardRef<ApprovalNotificationsHandle>(
  function ApprovalNotifications(_props, ref) {
    const t = useSettingsText();
    const { locale } = usePlatformLocale();
    const tRef = useRef(t);
    useEffect(() => { tRef.current = t; }, [t]);
    const notifications = useNotificationInbox(
      PLATFORM_COMMUNICATIONS_ENDPOINT,
      locale !== "ckb" ? {
        updateFailed: t("نوێکردنەوە سەرکەوتوو نەبوو"),
        deleteFailed: t("سڕینەوە سەرکەوتوو نەبوو"),
        deleteAllFailed: t("سڕینەوەی هەمووی سەرکەوتوو نەبوو"),
      } : undefined,
    );
    const [approvals, setApprovals] = useState<ApprovalNotification[]>([]);
    const [approvalsLoading, setApprovalsLoading] = useState(true);
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const lastApprovalsRef = useRef("");

    const loadApprovals = useCallback(async (showError = false) => {
      try {
        const response = await fetch("/api/platform/approvals?status=pending", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Approval request failed");
        const payload = await response.json();
        const pending: ApprovalNotification[] = Array.isArray(payload?.data)
          ? payload.data
          : [];
        const serialized = JSON.stringify(pending);
        if (serialized !== lastApprovalsRef.current) {
          lastApprovalsRef.current = serialized;
          setApprovals(pending);
        }
      } catch {
        if (showError) toast.error(tRef.current("بارکردنی ئاگادارییەکان سەرکەوتوو نەبوو"));
      } finally {
        setApprovalsLoading(false);
      }
    }, []);

    usePolling(loadApprovals, 20_000);

    const reviewApproval = useCallback(
      async (approval: ApprovalNotification, action: "approve" | "reject") => {
        if (reviewingId) return;
        const rejectionReason =
          action === "reject"
            ? window.prompt(t("هۆکاری ڕەتکردنەوە"))?.trim()
            : undefined;
        if (action === "reject" && !rejectionReason) return;

        setReviewingId(approval.id);
        try {
          const response = await fetch(
            `/api/platform/approvals/${approval.id}/${action}`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rejectionReason }),
            },
          );
          if (!response.ok) throw new Error("Approval review failed");
          setApprovals((current) =>
            current.filter((item) => item.id !== approval.id),
          );
          toast.success(
            t(action === "approve" ? "داواکاری پەسەندکرا" : "داواکاری ڕەتکرایەوە"),
          );
        } catch {
          toast.error(t("پێداچوونەوەی داواکاری سەرکەوتوو نەبوو"));
        } finally {
          setReviewingId(null);
        }
      },
      [reviewingId, t],
    );

    const refresh = useCallback(
      () => Promise.all([notifications.load(), loadApprovals()]),
      [loadApprovals, notifications],
    );

    useImperativeHandle(ref, () => ({ refresh }), [refresh]);

    const openAction = useCallback(
      (notification: CommunicationNotification) => {
        if (!notification.actionUrl) return;
        const destination = platformNotificationDestination(
          notification.actionUrl,
        );
        if (destination.startsWith("https://")) {
          window.open(destination, "_blank", "noopener,noreferrer");
        } else {
          window.location.assign(destination);
        }
      },
      [],
    );

    return (
      <NotificationBell
        copy={{
          title: t("ئاگادارییەکان"),
          loading: locale === "ar" ? "جارٍ تحميل الإشعارات" : locale === "en" ? "Loading notifications" : "ئاگادارییەکان بار دەکرێن",
          unread: t("بابەتی نەخوێندراو"),
          deleteAll: t("سڕینەوەی هەموو ئاگادارییەکان"),
          close: t("داخستن"),
          markAllRead: t("هەمووی خوێندراوەتەوە"),
          delete: t("سڕینەوە"),
          empty: t("هیچ ئاگادارییەک نییە"),
          emptyHint: t("کاتێک ئاگادارییەکی نوێ هات، لێرەدا دەردەکەوێت"),
        }}
        dateLocale={locale === "ar" ? "ar-IQ" : locale === "en" ? "en-IQ" : "ckb-IQ"}
        inbox={notifications.inbox}
        loading={notifications.loading || approvalsLoading}
        onRefresh={refresh}
        onRead={notifications.read}
        onDismiss={notifications.dismiss}
        onMarkAllRead={notifications.markAllRead}
        onDeleteAll={notifications.deleteAll}
        additionalUnreadCount={approvals.length}
        additionalContent={
          approvals.length > 0 ? (
            <PendingApprovalNotifications
              approvals={approvals}
              reviewingId={reviewingId}
              onReview={(approval, action) =>
                void reviewApproval(approval, action)
              }
            />
          ) : null
        }
        modalDescription={t("ئاگادارییەکانی پلاتفۆرم")}
        canOpenAction={canOpenPlatformNotification}
        onOpenAction={openAction}
        actionLabel={(notification) => t(notificationActionLabel(notification))}
      />
    );
  },
);
