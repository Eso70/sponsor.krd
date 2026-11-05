import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { businessMessages } from "@/features/business/i18n/messages";
import { SessionManagementPanel } from "./SessionManagementPanel";

describe("SessionManagementPanel Business copy", () => {
  it.each([
    ["/api/auth/sessions", false],
    ["/api/platform/settings/sessions", false],
    ["/api/platform/businesses/owner/sessions", true],
  ] as const)("uses the same confirmation and scope rules for %s", async (endpoint, administratorMode) => {
    const sessions = [true, false].map((current, n) => ({
      id: current ? 'current' : 'other', is_current: current, remembered: false,
      created_at: '2026-11-01T00:00:00Z', session_expires_at: '2026-11-10T00:00:00Z',
      ip_address: `192.0.2.${n}`, user_agent: 'Chrome/1 Windows',
    }));
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => new Response(JSON.stringify(
      init?.method === 'DELETE' ? { success: true } : { data: { sessions } },
    )));
    const onCountChange = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<SessionManagementPanel endpoint={endpoint} administratorMode={administratorMode} onCountChange={onCountChange} />);
    await waitFor(() => expect(onCountChange).toHaveBeenCalledWith(2));
    expect(screen.getAllByRole('button', { name: 'Revoke session' })).toHaveLength(administratorMode ? 2 : 1);
    await user.click(screen.getAllByRole('button', { name: 'Revoke session' }).at(-1)!);
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE')).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Revoke access' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(`${endpoint}/other`, expect.objectContaining({ method: 'DELETE' })));
    expect(onCountChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByText('Current')).toBeInTheDocument();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows Arabic confirmation controls without changing the session", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { sessions: [{
        id: "other-device", ip_address: "127.0.0.1", user_agent: "Chrome/1 Windows",
        created_at: "2026-09-23T10:00:00Z", session_expires_at: "2026-09-24T10:00:00Z",
        is_current: false, remembered: false,
      }] } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <SessionManagementPanel
        endpoint="/api/auth/sessions"
        copy={businessMessages.ar.SettingsSessions}
        dateLocale="ar-IQ"
      />,
    );

    await user.click(await screen.findByRole("button", { name: "تسجيل الخروج من كل الأجهزة الأخرى" }));
    expect(screen.getByRole("button", { name: "إلغاء الوصول" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "إلغاء" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
