import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as businessTheme from "@/lib/utils/business-error-theme";
import type { BusinessSubdomainTheme } from "@/lib/utils/business-error-theme";
import BusinessWorkspaceEntryPage from "./page";

describe("BusinessWorkspaceEntryPage", () => {
  beforeEach(() => {
    vi.spyOn(businessTheme, "loadBusinessSubdomainTheme").mockReturnValue(
      new Promise<BusinessSubdomainTheme>(() => undefined),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.cookie = "business_dashboard_locale=; Max-Age=0; Path=/";
  });

  it("offers tenant-scoped Google and email authentication", () => {
    render(<BusinessWorkspaceEntryPage />);
    expect(
      screen.getByRole("link", { name: "بە گوگڵ بەردەوام بە" }),
    ).toHaveAttribute("href", "/api/auth/google/start?remember=1");
    expect(
      screen.getByRole("textbox", { name: "ناونیشانی ئیمەیڵ" }),
    ).toBeVisible();
  });

  it("keeps the remembered-device choice on by default", () => {
    render(<BusinessWorkspaceEntryPage />);

    expect(
      screen.getByRole("checkbox", {
        name: /لەم ئامێرەدا چوونەژوورەوەم بپارێزە/,
      }),
    ).toBeChecked();

    expect(
      screen.getByRole("link", { name: "بە گوگڵ بەردەوام بە" }),
    ).toHaveAttribute("href", "/api/auth/google/start?remember=1");

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /لەم ئامێرەدا چوونەژوورەوەم بپارێزە/,
      }),
    );

    expect(
      screen.getByRole("link", { name: "بە گوگڵ بەردەوام بە" }),
    ).toHaveAttribute("href", "/api/auth/google/start");
  });

  it("requests a one-time code for the entered business email", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            challengeId: "a".repeat(43),
            expiresInSeconds: 600,
            resendAfterSeconds: 60,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(<BusinessWorkspaceEntryPage />);

    fireEvent.change(screen.getByRole("textbox", { name: "ناونیشانی ئیمەیڵ" }), {
      target: { value: "owner@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "بە ئیمەیڵ بەردەوام بە" }),
    );

    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "کۆدی چوونەژوورەوە" })).toBeVisible(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/email/request",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "owner@example.com" }),
      }),
    );
  });

  it("renders business tenant style and never SponsorKrd platform branding during loading", () => {
    render(<BusinessWorkspaceEntryPage />);

    expect(screen.getByText("پانێڵی بزنس")).toBeInTheDocument();
    expect(screen.getByText("بزنس")).toBeInTheDocument();
    expect(screen.queryByText("Sponsor.krd")).not.toBeInTheDocument();
    expect(screen.queryByText("پانێڵی پلاتفۆڕم")).not.toBeInTheDocument();
  });

  it("updates to the loaded tenant business name once theme resolves", async () => {
    vi.spyOn(businessTheme, "loadBusinessSubdomainTheme").mockResolvedValue({
      name: "کۆمپانیای نموونە",
      websiteColor: {
        type: "solid",
        css: "#123456",
        primary: "#123456",
        raw: "#123456",
      },
      favicon: null,
      logo: null,
      subdomain: "example",
    });

    render(<BusinessWorkspaceEntryPage />);

    await waitFor(() => {
      expect(screen.getByText("کۆمپانیای نموونە")).toBeInTheDocument();
    });
    expect(screen.getByText("پانێڵی بزنس")).toBeInTheDocument();
    expect(screen.queryByText("Sponsor.krd")).not.toBeInTheDocument();
    expect(screen.queryByText("پانێڵی پلاتفۆڕم")).not.toBeInTheDocument();
  });

  it("switches pre-sign-in controls to Arabic without changing the Google route", () => {
    const { container } = render(<BusinessWorkspaceEntryPage />);
    fireEvent.click(screen.getByRole("button", { name: "گۆڕینی زمان بۆ عەرەبی" }));

    expect(screen.getByRole("heading", { name: "تسجيل دخول النشاط التجاري" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "المتابعة باستخدام Google" })).toHaveAttribute("href", "/api/auth/google/start?remember=1");
    expect(screen.getByRole("textbox", { name: "عنوان البريد الإلكتروني" })).toBeInTheDocument();
    expect(document.cookie).toContain("business_dashboard_locale=ar");
    expect(container.querySelector("main")).toHaveAttribute("lang", "ar");
  });

  it("restores a previously selected Arabic language before sign-in", async () => {
    document.cookie = "business_dashboard_locale=ar; Path=/";
    render(<BusinessWorkspaceEntryPage />);

    expect(await screen.findByRole("heading", { name: "تسجيل دخول النشاط التجاري" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "التبديل إلى الإنجليزية" })).toHaveTextContent("EN");
  });
});
