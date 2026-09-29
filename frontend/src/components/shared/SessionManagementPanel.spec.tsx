import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { businessMessages } from "@/features/business/i18n/messages";
import { SessionManagementPanel } from "./SessionManagementPanel";

describe("SessionManagementPanel Business copy", () => {
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
