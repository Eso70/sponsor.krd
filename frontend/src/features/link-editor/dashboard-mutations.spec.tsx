import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BusinessLinktreeSummary } from "@linktree/types";
import type { LinktreeEditorDrawerProps } from "./components/LinktreeEditorDrawer";
import type { LinktreesManagementPageProps } from "./components/LinktreesManagementPage";
import { BusinessDashboard } from "@/components/business/BusinessDashboard";
import { PlatformLinktreesPage } from "@/features/platform-admin/components/PlatformLinktreesPage";
import { ApiRequestError } from "@/lib/api/request";

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/api/request", async (original) => ({
  ...(await original<typeof import("@/lib/api/request")>()),
  apiRequest: mocks.request,
}));
vi.mock("sonner", () => ({ toast: { success: mocks.success, info: mocks.info, error: mocks.error } }));
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/business/pages",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/features/business/i18n/BusinessLocaleProvider", () => ({ useBusinessLocale: () => ({ locale: "en" }) }));
vi.mock("@/features/platform-admin/i18n/PlatformLocaleProvider", () => ({ usePlatformLocale: () => ({ locale: "en" }) }));
vi.mock("@/lib/contexts/ThemeProvider", () => ({ ThemeProvider: ({ children }: { children: ReactNode }) => children }));
vi.mock("@/lib/utils/usePolling", () => ({ usePolling: () => {} }));
vi.mock("@/hooks/useAppTheme", () => ({ useAppTheme: () => ({ theme: "light", toggleTheme: vi.fn() }) }));
vi.mock("@/features/business/hooks/useBusinessAnalyticsTotals", () => ({
  useBusinessAnalyticsTotals: () => ({
    totals: { total_views: 0, unique_views: 0, total_clicks: 0, unique_clicks: 0, contact_actions: 0 },
    isLoading: false, isRefreshing: false, unavailable: false, refresh: mocks.refresh,
  }),
}));
vi.mock("@/lib/brand/tab-branding", () => ({ applyTabIcon: () => {} }));
vi.mock("@/components/shared/DrawerPresence", () => ({ DrawerPresence: ({ children }: { children: ReactNode }) => children }));
vi.mock("@/components/shared/DashboardHeader", () => ({ DashboardHeader: () => null }));
vi.mock("@/components/shared/DashboardSidebar", () => ({ DashboardSidebar: () => null }));
vi.mock("@/components/shared/DashboardAppearanceControls", () => ({ DashboardAppearanceControls: () => null }));
vi.mock("@/features/business/components/BusinessSidebarFooter", () => ({ BusinessSidebarFooter: () => null }));
vi.mock("@/features/business/components/BusinessLanguageSelector", () => ({ BusinessLanguageSelector: () => null }));
vi.mock("@/features/billing/components/BusinessSubscriptionModal", () => ({ BusinessSubscriptionModal: () => null }));
vi.mock("@/features/communications/BusinessCommunicationBell", () => ({ BusinessCommunicationBell: () => null }));
vi.mock("@/features/communications/BusinessAnnouncementBanners", () => ({ BusinessAnnouncementBanners: () => null }));
vi.mock("@/components/shared/LinktreeSearchModal", () => ({ LinktreeSearchModal: () => null }));
vi.mock("@/components/shared/ConfirmDeleteModal", () => ({
  ConfirmDeleteModal: ({ isOpen, onConfirm }: { isOpen: boolean; onConfirm: () => Promise<void> }) => isOpen
    ? <button onClick={() => void onConfirm()}>Confirm deletion</button> : null,
}));
vi.mock("@/features/link-editor/components/LinktreeEditorDrawer", () => ({
  LinktreeEditorDrawer: ({ onSubmit, editData, isLoadingEditData, management }: LinktreeEditorDrawerProps) => (
    <section aria-label="Editor">
      <button disabled={isLoadingEditData} onClick={() => void Promise.resolve(onSubmit({
        headline: "Edited page", description: "", logo: null, background_color: "#ffffff",
        templateKey: "spectrum", templateConfig: {}, platforms: ["website"],
        links: { website: ["https://example.com"] },
      }, editData?.linktree.id)).catch(() => {})}>Save edit</button>
      {management?.onToggleStatus && <button onClick={() => void management.onToggleStatus!(management.item.id, "inactive")}>Pause page</button>}
    </section>
  ),
}));
vi.mock("@/features/business/components/BusinessLinktreesPage", () => ({ BusinessLinktreesPage: Collection }));
vi.mock("@/features/link-editor/components/LinktreesManagementPage", () => ({ LinktreesManagementPage: Collection }));

function Collection({ linktrees, onEdit, onToggleArchive, onDelete }: LinktreesManagementPageProps) {
  return <section aria-label="Pages">{linktrees.map((page) => <div key={page.id}>
    <span>{page.name}</span><span>{page.status}</span>
    <button onClick={() => onEdit(page.id)}>Edit {page.name}</button>
    {onDelete && <button onClick={() => onDelete(page.id, page.uid, page.name)}>Delete {page.name}</button>}
    {onToggleArchive && <button onClick={() => void onToggleArchive(page.id, true)}>Archive {page.name}</button>}
    {page.is_archived && <span>Archived</span>}
  </div>)}</section>;
}

const page: BusinessLinktreeSummary = {
  id: "8b86c111-63e3-41bf-b454-49c48226291f", uid: "example", name: "Original page",
  created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z",
  subtitle: null, description: "Old description", seo_name: "example", image: null,
  background_color: "#ffffff", template_key: "spectrum", template_config: {},
  whatsapp_modal_enabled: false, footer_text: null, footer_phone: null, footer_hidden: false,
  status: "active", is_default: false, business_default_avatar: null,
};
let saved = false;
let response: "saved" | "approval" | "failed" = "saved";

beforeEach(() => {
  vi.clearAllMocks();

  saved = false;
  response = "saved";
  mocks.request.mockImplementation(async (url: string, options?: { method?: string }) => {
    if (url.endsWith("/context")) return { branding: { name: "Sponsor.krd", logo: null, avatar: null, favicon: null, accentColor: "#25F4EE" }, publicPathPrefix: "/linktree" };
    if (url.endsWith("/analytics/summary")) return { total_views: 0, unique_views: 0, total_clicks: 0, unique_clicks: 0 };
    if (url.endsWith("/edit")) return { linktree: page, links: [] };
    if (options?.method === "PATCH" || options?.method === "POST" || options?.method === "DELETE") {
      if (response === "approval") throw new ApiRequestError("Awaiting approval", { status: 202, code: "APPROVAL_REQUIRED", payload: { success: false, approval: { id: "approval", status: "pending" } } });
      if (response === "failed") throw new ApiRequestError("Write failed", { status: 500, code: "WRITE_FAILED" });
      saved = true;
      return { ...page, name: "Edited page", description: "" };
    }
    return [saved ? { ...page, name: "Edited page", description: "" } : page];
  });
});

function dashboard(scope: "business" | "platform") {
  return scope === "business"
    ? <BusinessDashboard currentUsername="example" businessName="Example" initialLinktrees={[page]} />
    : <PlatformLinktreesPage />;
}

async function openEditor(scope: "business" | "platform") {
  render(dashboard(scope));
  fireEvent.click(await screen.findByRole("button", { name: "Edit Original page" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Save edit" })).toBeEnabled());
}

describe.each(["business", "platform"] as const)("%s Linktree mutation integration", (scope) => {
  it("saves the complete edit once, including an explicit cleared description", async () => {
    await openEditor(scope);
    fireEvent.click(screen.getByRole("button", { name: "Save edit" }));
    await waitFor(() => expect(screen.queryByRole("region", { name: "Editor" })).not.toBeInTheDocument());
    expect(await screen.findByText("Edited page")).toBeVisible();
    const writes = mocks.request.mock.calls.filter(([, options]) => options?.method === "PATCH" || options?.method === "POST");
    expect(writes).toHaveLength(1);
    expect(writes[0]).toEqual([
      `${scope === "business" ? "/api/linktrees" : "/api/platform/linktrees"}/${page.id}`,
      expect.objectContaining({ method: "PATCH", json: expect.objectContaining({ description: "", links: { website: ["https://example.com"] } }) }),
    ]);
    expect(mocks.request.mock.calls.some(([url]) => url.endsWith("/links") || url.endsWith("/links/batch"))).toBe(false);
  });

  it("reports pending approval without announcing a save or changing the list", async () => {
    response = "approval";
    await openEditor(scope);
    fireEvent.click(screen.getByRole("button", { name: "Save edit" }));
    await waitFor(() => expect(mocks.info).toHaveBeenCalled());
    expect(mocks.info).toHaveBeenCalledWith(expect.stringMatching(/approval/i));
    expect(mocks.success).not.toHaveBeenCalled();
    expect(screen.getByText("Original page")).toBeVisible();
    expect(screen.queryByText("Edited page")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Editor" })).not.toBeInTheDocument();
    expect(mocks.request.mock.calls.filter(([, options]) => options?.method === "PATCH" || options?.method === "POST")).toHaveLength(1);
  });

  it("does not optimistically publish status or archive changes awaiting approval", async () => {
    response = "approval";
    await openEditor(scope);
    fireEvent.click(screen.getByRole("button", { name: "Pause page" }));
    await waitFor(() => expect(mocks.info).toHaveBeenCalledTimes(1));
    expect(screen.getByText("active")).toBeVisible();
    expect(screen.queryByText("inactive")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Archive Original page" }));
    await waitFor(() => expect(mocks.info).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("Archived")).not.toBeInTheDocument();
    expect(mocks.success).not.toHaveBeenCalled();
    const base = scope === "business" ? "/api/linktrees" : "/api/platform/linktrees";
    expect(mocks.request).toHaveBeenCalledWith(`${base}/${page.id}/status`, { method: "PATCH", json: { status: "inactive" } });
    expect(mocks.request).toHaveBeenCalledWith(`${base}/${page.id}/archive`, { method: "PATCH", json: { is_archived: true } });
  });

  it("keeps the page listed when deletion awaits approval", async () => {
    response = "approval";
    render(dashboard(scope));
    fireEvent.click(await screen.findByRole("button", { name: "Delete Original page" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm deletion" }));
    await waitFor(() => expect(mocks.info).toHaveBeenCalledWith(expect.stringMatching(/approval/i)));
    expect(screen.getByText("Original page")).toBeVisible();
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.request).toHaveBeenCalledWith(`${scope === "business" ? "/api/linktrees" : "/api/platform/linktrees"}/${page.id}`, { method: "DELETE" });
  });

});


