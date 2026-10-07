import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvitationEntryPage } from "./InvitationEntryPage";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

describe("InvitationEntryPage", () => {
  beforeEach(() => {
    window.history.replaceState(
      {},
      "",
      "/join?token=valid-invitation-token-1234567890",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          expiresAt: "2026-08-10T06:00:00.000Z",
        }),
      }),
    );
  });

  it("keeps the validated token for Google signup after hiding it from the URL", async () => {
    const view = render(<RootPublicLocaleProvider initialLocale="ckb"><InvitationEntryPage /></RootPublicLocaleProvider>);

    const continueLink = await screen.findByRole("link", {
      name: "بە گوگڵ بەردەوام بە",
    });
    await waitFor(() => expect(window.location.search).toBe(""));

    view.rerender(<RootPublicLocaleProvider initialLocale="ckb"><InvitationEntryPage /></RootPublicLocaleProvider>);

    expect(continueLink).toHaveAttribute(
      "href",
      "/api/signup/google/start?invite=valid-invitation-token-1234567890",
    );
  });

  it("shows the email-code signup option after the invitation validates", async () => {
    render(<RootPublicLocaleProvider initialLocale="ckb"><InvitationEntryPage /></RootPublicLocaleProvider>);

    expect(
      await screen.findByRole("textbox", { name: "ئیمەیڵ" }),
    ).toBeInTheDocument();
  });

  it("uses the shared expired error page for an expired invitation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 410,
        json: vi.fn().mockResolvedValue({ message: "Invitation expired" }),
      }),
    );

    render(<RootPublicLocaleProvider initialLocale="ckb"><InvitationEntryPage /></RootPublicLocaleProvider>);

    expect(
      await screen.findByRole("heading", {
        name: "بانگهێشتنامەکە بەسەرچووە",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("410")).toBeInTheDocument();
  });

  it("shows Arabic invitation controls for an Arabic visitor", async () => {
    render(<RootPublicLocaleProvider initialLocale="ar"><InvitationEntryPage /></RootPublicLocaleProvider>);
    expect(await screen.findByRole("link", { name: "المتابعة باستخدام جوجل" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "البريد الإلكتروني" })).toBeInTheDocument();
  });
});
