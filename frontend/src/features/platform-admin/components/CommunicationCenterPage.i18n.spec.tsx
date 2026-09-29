import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { CommunicationCenterPage } from "./CommunicationCenterPage";
import { formatNotificationDate } from "@/features/communications/format";
import type { Announcement, Conversation } from "@/features/communications/types";

const fixtures = vi.hoisted(() => ({
  announcements: [] as Announcement[],
  conversations: [] as Conversation[],
}));

vi.mock("@/features/communications/api", () => ({
  communicationRequest: vi.fn(async (path: string) => {
    if (path.endsWith("/overview"))
      return {
        announcements: { total: 0, active: 0, scheduled: 0, drafts: 0, homepage: 0, failed: 0 },
        conversations: { open: 0, waitingPlatform: 0, unreadMessages: 0 },
        notifications: { unread: 0 },
      };
    if (path.endsWith("/billing")) return { plans: [] };
    if (path.endsWith("/announcements")) return fixtures.announcements;
    if (path.endsWith("/conversations")) return fixtures.conversations;
    if (path.includes("/conversations/")) return fixtures.conversations[0];
    return [];
  }),
}));
vi.mock("@/lib/utils/usePolling", () => ({ usePolling: () => {} }));

describe("CommunicationCenterPage Arabic", () => {
  afterEach(() => {
    fixtures.announcements = [];
    fixtures.conversations = [];
  });

  it.each([
    { locale: "ckb" as const, tab: "پەیامەکانی بزنس", category: "داواکاری تایبەتمەندی" },
    { locale: "ar" as const, tab: "رسائل الأنشطة التجارية", category: "طلب ميزة" },
    { locale: "en" as const, tab: "Business messages", category: "Feature request" },
  ])("translates conversation categories in $locale", async ({ locale, tab, category }) => {
    fixtures.conversations = [{
      id: "conversation-1", businessId: "business-1", businessName: "Example business",
      subject: "Question", category: "feature_request", priority: "normal", status: "open",
      lastMessageAt: "2026-09-01T10:30:00.000Z", createdAt: "2026-09-01T10:30:00.000Z",
      messages: [],
    }];
    render(<PlatformLocaleProvider initialLocale={locale}><CommunicationCenterPage /></PlatformLocaleProvider>);
    fireEvent.click(await screen.findByRole("tab", { name: tab }));
    fireEvent.click(await screen.findByRole("button", { name: /Example business Question/ }));
    expect(await screen.findByText(`Example business • ${category}`)).toBeInTheDocument();
  });

  it.each([
    { locale: "ar" as const, tab: "السجل", intl: "ar-IQ" },
    { locale: "en" as const, tab: "History", intl: "en-IQ" },
  ])("formats history dates in $locale", async ({ locale, tab, intl }) => {
    fixtures.announcements = [{
      id: "announcement-1", title: "Published notice", message: "Published content",
      announcementType: "general", priority: "normal", audienceType: "all", audienceFilter: {},
      channels: ["business_bell"], status: "published", createdAt: "2026-09-01T10:30:00.000Z",
      updatedAt: "2026-09-01T10:30:00.000Z", deliveredCount: 0, readCount: 0, failedCount: 0,
    }];
    render(<PlatformLocaleProvider initialLocale={locale}><CommunicationCenterPage /></PlatformLocaleProvider>);
    fireEvent.click(await screen.findByRole("tab", { name: tab }));
    expect(await screen.findByText(formatNotificationDate("2026-09-01T10:30:00.000Z", intl))).toBeInTheDocument();
  });
  it("localizes the overview, tabs, and announcement editor", async () => {
    render(
      <PlatformLocaleProvider initialLocale="ar">
        <CommunicationCenterPage />
      </PlatformLocaleProvider>,
    );

    expect(await screen.findByText("أحدث الإعلانات")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "الإعلانات" }));
    expect(screen.getByRole("heading", { name: "الإعلانات" })).toBeInTheDocument();
    expect(screen.getByText("لا توجد بيانات لعرضها.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "إعلان جديد" }));
    expect(screen.getByPlaceholderText("اكتب عنوان الإعلان")).toBeInTheDocument();
    expect(screen.getByText("قنوات التسليم")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "فتح وقت النشر" }));
    expect(screen.getByRole("button", { name: "الشهر السابق" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "اليوم" })).toBeInTheDocument();
  });

  it("localizes the announcement editor and date picker in English", async () => {
    render(<PlatformLocaleProvider initialLocale="en"><CommunicationCenterPage /></PlatformLocaleProvider>);
    expect(await screen.findByText("Recent announcements")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Announcements" }));
    fireEvent.click(screen.getByRole("button", { name: "New announcement" }));
    expect(screen.getByPlaceholderText("Enter announcement title")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open Publish time" }));
    expect(screen.getByRole("button", { name: "Previous month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Today" })).toBeInTheDocument();
  });
});
