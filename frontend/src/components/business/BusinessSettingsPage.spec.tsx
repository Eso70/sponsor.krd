import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { formsApi } from "@/features/forms/api";
import { formWhatsAppSettingsCopy } from "@/features/forms/form-whatsapp-settings-copy";
import { formWhatsAppCopy, defaultFormWhatsAppTemplate, defaultFormWhatsAppDetails } from "@/features/forms/form-submission-whatsapp";
import { formsCopy } from "@/features/forms/forms-copy";
import { BusinessLocaleProvider } from "@/features/business/i18n/BusinessLocaleProvider";
import { afterEach, describe, expect, it, vi } from "vitest";
import { businessMessages } from "@/features/business/i18n/messages";
import { BusinessSettingsPage } from "./BusinessSettingsPage";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/shared/ColorGradientModal", () => ({ ColorGradientModal: () => null }));
vi.mock("@/features/communications/BusinessMessagesPanel", () => ({ BusinessMessagesPanel: () => <div>Business messages</div> }));
vi.mock("@/features/forms/api", () => ({ formsApi: { whatsappTemplates: vi.fn(), saveWhatsAppTemplate: vi.fn() } }));

afterEach(() => vi.unstubAllGlobals());

describe.each(["en", "ar", "ckb"] as const)("Business Settings shared layout (%s)", (locale) => {
  it("saves and restores Form message defaults in Settings without changing Profile drafts", async () => {
    vi.clearAllMocks();
    vi.mocked(formsApi.whatsappTemplates).mockResolvedValue({ [locale]: "Saved {{name}}" });
    vi.mocked(formsApi.saveWhatsAppTemplate).mockResolvedValue({ [locale]: "Changed {{name}}" });
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify({ data: url.includes("effective-access") ? {
      subscription: { planCode: "max" }, permissions: { "business:forms:read": { outcome: "allow" }, "business:forms:update": { outcome: "allow" }, "business:profile:update": { outcome: "allow" } },
    } : { name: "Original" } }))));
    render(<BusinessLocaleProvider initialLocale={locale}><BusinessSettingsPage/></BusinessLocaleProvider>);
    const copy = businessMessages[locale].SettingsPage;
    const name = await screen.findByPlaceholderText(copy.businessName);
    fireEvent.change(name, { target: { value: "Unsaved profile" } });
    fireEvent.click(screen.getByRole("tab", { name: formWhatsAppSettingsCopy(locale).tab }));
    const panel = screen.getByRole("region", { name: formWhatsAppSettingsCopy(locale).title });
    const field = await within(panel).findByRole("textbox", { name: formWhatsAppCopy(locale).message });
    expect(field).toHaveValue("Saved {{name}}");
    fireEvent.change(field, { target: { value: "Changed {{name}}" } });
    fireEvent.click(within(panel).getByRole("button", { name: formsCopy(locale).save }));
    await waitFor(() => expect(formsApi.saveWhatsAppTemplate).toHaveBeenCalledWith("business", locale, "Changed {{name}}", expect.any(AbortSignal), expect.objectContaining({ order: "products_first", style: "compact" })));
    await waitFor(() => expect(within(panel).getByRole("button", { name: formsCopy(locale).save })).toBeEnabled());
    fireEvent.change(field, { target: { value: "Discard this edit" } });
    fireEvent.change(within(panel).getByRole("textbox", { name: formWhatsAppSettingsCopy(locale).heading }), { target: { value: "Unsaved heading" } });
    expect(within(panel).queryByRole("button", { name: formsCopy(locale).cancel })).not.toBeInTheDocument();
    fireEvent.click(within(panel).getByRole("button", { name: formWhatsAppSettingsCopy(locale).restoreDefaults }));
    expect(field).toHaveValue(defaultFormWhatsAppTemplate(locale));
    expect(within(panel).getByRole("textbox", { name: formWhatsAppSettingsCopy(locale).heading })).toHaveValue(defaultFormWhatsAppDetails(locale).heading);
    expect(formsApi.saveWhatsAppTemplate).toHaveBeenCalledOnce();
    fireEvent.click(within(panel).getByRole("button", { name: formsCopy(locale).save }));
    await waitFor(() => expect(formsApi.saveWhatsAppTemplate).toHaveBeenLastCalledWith("business", locale, null, expect.any(AbortSignal), defaultFormWhatsAppDetails(locale)));
    fireEvent.click(screen.getByRole("tab", { name: copy.profileTab }));
    expect(screen.getByPlaceholderText(copy.businessName)).toHaveValue("Unsaved profile");
  });
  it('does not allow branding uploads when profile saving is denied, but preserves username editing', async () => {
    const copy = businessMessages[locale].SettingsPage;
    const request = vi.fn(async (url: string) => new Response(JSON.stringify({ data: url.includes('effective-access') ? { permissions: {
      'business:profile:update': { outcome: 'deny' }, 'business:profile-assets:upload': { outcome: 'allow' }, 'business:security:username-update': { outcome: 'allow' },
    } } : url.includes('linktrees/default') ? null : { name: 'Business', username: 'original' } })));
    vi.stubGlobal('fetch', request);
    render(<BusinessLocaleProvider initialLocale={locale}><BusinessSettingsPage /></BusinessLocaleProvider>);
    await screen.findByPlaceholderText(copy.businessName);
    expect(screen.getByLabelText(copy.logo)).toBeDisabled();
    expect(screen.getByLabelText(copy.avatar)).toBeDisabled();
    expect(screen.getByLabelText(copy.favicon)).toBeDisabled();
    const username = screen.getByDisplayValue('original');
    expect(username).toBeEnabled();
    fireEvent.change(username, { target: { value: 'new-username' } });
    fireEvent.click(screen.getByRole('button', { name: copy.save }));
    await waitFor(() => expect(request).toHaveBeenCalledWith('/api/auth/settings', expect.objectContaining({ body: JSON.stringify({ section: 'profile', username: 'new-username' }) })));
  });
  it('preserves Profile edits while independently saving Defaults', async () => {
    const copy = businessMessages[locale].SettingsPage;
    let homepage = false;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') homepage = JSON.parse(init.body as string).homepage_linktree;
      return new Response(JSON.stringify({ data: url.includes('effective-access') ? { permissions: { 'business:profile:update': { outcome: 'allow' }, 'business:defaults:update': { outcome: 'allow' } } } : url.includes('linktrees/default') ? null : { name: 'Original business', homepage_linktree: homepage } }));
    }));
    render(<BusinessLocaleProvider initialLocale={locale}><BusinessSettingsPage /></BusinessLocaleProvider>);
    fireEvent.change(await screen.findByPlaceholderText(copy.businessName), { target: { value: 'Unsaved business' } });
    fireEvent.click(screen.getByRole('tab', { name: copy.defaultsTab }));
    expect(screen.getByRole('button', { name: copy.savedButton })).toBeDisabled();
    fireEvent.click(screen.getByRole('switch', { name: copy.homepageLinktree }));
    fireEvent.click(screen.getByRole('button', { name: copy.save }));
    await waitFor(() => expect(screen.getByRole('button', { name: copy.savedButton })).toBeDisabled());
    fireEvent.click(screen.getByRole('tab', { name: copy.profileTab }));
    expect(screen.getByPlaceholderText(copy.businessName)).toHaveValue('Unsaved business');
    expect(screen.getByRole('button', { name: copy.save })).toBeEnabled();
  });
  it("saves and reloads the reversible homepage choice", async () => {
    let saved = false;
    const request = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "PATCH") saved = JSON.parse(init.body as string).homepage_linktree;
      return new Response(JSON.stringify({ data: url.includes("effective-access")
        ? { permissions: { "business:defaults:update": { outcome: "allow" } } }
        : url.includes("linktrees/default") ? null
        : { name: "Sample business", homepage_linktree: saved } }));
    });
    vi.stubGlobal("fetch", request);
    const copy = businessMessages[locale].SettingsPage;
    const view = render(<BusinessLocaleProvider initialLocale={locale}><BusinessSettingsPage /></BusinessLocaleProvider>);
    await screen.findByPlaceholderText(copy.businessName);
    fireEvent.click(screen.getByRole("tab", { name: copy.defaultsTab }));
    const toggle = await screen.findByRole("switch", { name: copy.homepageLinktree });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: copy.save }));
    await waitFor(() => expect(saved).toBe(true));
    await waitFor(() => expect(screen.getByRole("button", { name: copy.savedButton })).toBeDisabled());
    view.unmount();
    render(<BusinessLocaleProvider initialLocale={locale}><BusinessSettingsPage /></BusinessLocaleProvider>);
    await screen.findByPlaceholderText(copy.businessName);
    fireEvent.click(screen.getByRole("tab", { name: copy.defaultsTab }));
    expect(await screen.findByRole("switch", { name: copy.homepageLinktree })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("switch", { name: copy.homepageLinktree }));
    fireEvent.click(screen.getByRole("button", { name: copy.save }));
    await waitFor(() => expect(saved).toBe(false));
  });
  it("does not display defaults as saved data or allow saving after a load failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));
    const copy = businessMessages[locale].SettingsPage;
    render(<BusinessLocaleProvider initialLocale={locale}><BusinessSettingsPage /></BusinessLocaleProvider>);
    expect(await screen.findByRole("alert")).toHaveTextContent(copy.loadFailed);
    expect(screen.queryByPlaceholderText(copy.businessName)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.save })).not.toBeInTheDocument();
  });
  it("keeps three tabs, branding uploads, editable fields and defaults available", async () => {
    const copy = businessMessages[locale].SettingsPage;
    const request = vi.fn(async (url: string, _init?: RequestInit) => new Response(JSON.stringify({ data:
      url.includes("effective-access") ? { permissions: {
        "business:profile:update": { outcome: "allow" },
        "business:profile-assets:upload": { outcome: "allow" },
        "business:security:username-update": { outcome: "allow" },
      } } : url.includes("linktrees/default") ? null : {
        name: "Sample business", email: "owner@example.com", ownerName: "Owner",
        username: "sample", subdomain: "sample", phone: "+9647501234567",
        default_template: "spectrum", website_color: "#7950f2",
      },
    }), { status: 200 }));
    vi.stubGlobal("fetch", request);
    render(<BusinessLocaleProvider initialLocale={locale}><BusinessSettingsPage /></BusinessLocaleProvider>);
    const name = await screen.findByPlaceholderText(copy.businessName);
    expect(name).toHaveValue("Sample business");
    expect(name).toBeEnabled();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.queryByRole("tab", { name: copy.securityTab })).not.toBeInTheDocument();
    expect(screen.getByLabelText(copy.logo)).toBeEnabled();
    expect(screen.getByLabelText(copy.avatar)).toBeEnabled();
    expect(screen.getByLabelText(copy.favicon)).toBeEnabled();
    expect(screen.getByPlaceholderText(copy.subdomain)).toHaveAttribute("readonly");
    fireEvent.change(name, { target: { value: "Updated business" } });
    expect(screen.getByRole("button", { name: copy.save })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: copy.save }));
    await waitFor(() => {
      const patch = request.mock.calls.find(([, init]) => init?.method === "PATCH");
      expect(JSON.parse(patch?.[1]?.body as string)).toEqual({ section: "profile", name: "Updated business" });
    });
    fireEvent.click(screen.getByRole("tab", { name: copy.defaultsTab }));
    await waitFor(() => expect(screen.getByRole("heading", { name: copy.defaultsTab })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("tab", { name: copy.messagesTab }));
    expect(screen.getByText("Business messages")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.save })).not.toBeInTheDocument();
  });
});
