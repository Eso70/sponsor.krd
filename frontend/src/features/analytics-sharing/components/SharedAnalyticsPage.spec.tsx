import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SharedAnalyticsPage } from "./SharedAnalyticsPage";
import { ApiRequestError } from "@/lib/api/request";
import { sharingCopy } from "../sharing-copy";
import { nextLanguageLocale } from "@/components/shared/LanguageToggle";
import { formsCopy } from "@/features/forms/forms-copy";
const request = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/request", async (original) => ({
  ...(await original<typeof import("@/lib/api/request")>()),
  apiRequest: request,
}));
describe("shared analytics access", () => {
  it.each(["en", "ar", "ckb"] as const)(
    "shows permitted form responses and paginates in %s",
    async (locale) => {
      request.mockImplementation(async (url) => {
        const report = {
          name: "Customer form",
          pageType: "form",
          locale,
          expiresAt: null,
          accentColor: "#14b8a6",
          views: 30,
          visitors: 25,
          clicks: 9,
          clickers: 7,
          contactActions: 0,
          submissions: 21,
          averageActiveSeconds: 10,
          daily: [],
          actions: [],
          formAnalytics: {
            views: 30,
            visitors: 25,
            starts: 23,
            submissions: 21,
            clicks: 9,
          },
          responses: {
            total: 21,
            items: [
              {
                id: String(url),
                createdAt: "2026-10-20T00:00:00Z",
                consent: true,
                revision: 1,
                answers: [
                  {
                    questionId: "phone",
                    label: "Phone",
                    value: String(url).includes("page=1")
                      ? "+9647509999999"
                      : "+9647501234567",
                  },
                ],
              },
            ],
          },
        };
        return String(url).includes("/responses?") ? report.responses : report;
      });
      render(
        <SharedAnalyticsPage
          id="form-share"
          initialLocale={locale}
          branding={{
            name: "Customer business",
            logo: "/images/business-logo-placeholder.png",
            favicon: null,
            accentColor: "#14b8a6",
            origin: "https://customer.sponsor.krd",
            businessTenant: true,
          }}
        />,
      );
      await screen.findByRole(
        "heading",
        { name: "Customer form" },
        { timeout: 3000 },
      );
      expect(screen.getByRole("main")).toHaveAttribute("dir", "ltr");
      expect(
        within(screen.getByRole("banner")).getByRole("img", {
          name: "Customer business",
        }),
      ).toBeInTheDocument();
      const readsBeforeLanguageChange = request.mock.calls.length;
      let activeLocale = locale;
      for (let index = 0; index < 3; index++) {
        fireEvent.click(
          document.querySelector<HTMLButtonElement>("[data-language-toggle]")!,
        );
        activeLocale = nextLanguageLocale(activeLocale);
        expect(screen.getByRole("main")).toHaveAttribute("lang", activeLocale);
        expect(screen.getByRole("main")).toHaveAttribute("dir", "ltr");
        expect(
          screen.getByRole("columnheader", {
            name: formsCopy(activeLocale).submittedAt,
          }),
        ).toBeInTheDocument();
      }
      expect(request).toHaveBeenCalledTimes(readsBeforeLanguageChange);
      expect(
        within(screen.getByRole("banner")).getByRole("heading", {
          name: "Customer business",
        }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(sharingCopy(locale).readOnly),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(sharingCopy(locale).never),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("region", { name: formsCopy(locale).submissions }),
      ).toBeInTheDocument();
      expect(screen.getAllByText("+9647501234567").length).toBeGreaterThan(0);
      fireEvent.click(
        screen.getByRole("button", { name: formsCopy(locale).next }),
      );
      await waitFor(() =>
        expect(request).toHaveBeenCalledWith(
          "/api/public/analytics-shares/form-share/responses?page=1&pageSize=20",
          expect.objectContaining({ signal: expect.any(AbortSignal) }),
        ),
      );
      await screen.findAllByText("+9647509999999");
      expect(screen.queryByText("+9647501234567")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("columnheader", { name: formsCopy(locale).source }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("columnheader", {
          name: formsCopy(locale).timeSpent,
        }),
      ).toBeInTheDocument();
    },
  );
  it("requires six digits before unlocking and clears the report when access is revoked", async () => {
    let unlocked = false,
      revoked = false;
    request.mockImplementation(async (_url, options) => {
      if (options?.method === "POST") {
        unlocked = true;
        return {};
      }
      if (!unlocked || revoked)
        throw new ApiRequestError("Unauthorized", {
          status: 401,
          code: "UNAUTHORIZED",
        });
      return {
        name: "Shared page",
        pageType: "linktree",
        locale: "en",
        expiresAt: null,
        views: 10,
        visitors: 4,
        clicks: 6,
        clickers: 3,
        contactActions: 2,
        submissions: null,
        averageActiveSeconds: 8,
        daily: [],
        actions: [],
        privateValue: "private-answer",
      };
    });
    render(<SharedAnalyticsPage id="share" />);
    const input = await screen.findByRole("textbox", { name: "Access code" });
    await waitFor(() => expect(input).toBeEnabled());
    expect(input).toHaveAttribute("placeholder", "– – – – – –");
    const button = screen.getByRole("button", { name: "View analytics" });
    expect(button).toBeDisabled();
    fireEvent.change(input, { target: { value: "001234" } });
    fireEvent.click(button);
    await screen.findByRole("heading", { name: "Shared page" });
    expect(request).toHaveBeenCalledWith(
      "/api/public/analytics-shares/share/unlock",
      { method: "POST", json: { code: "001234" } },
    );
    expect(screen.queryByText("private-answer")).not.toBeInTheDocument();
    revoked = true;
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Shared page" }),
      ).not.toBeInTheDocument(),
    );
    await screen.findByRole("heading", {
      name: "This shared link is no longer available",
    });
    expect(
      screen.queryByRole("textbox", { name: "Access code" }),
    ).not.toBeInTheDocument();
  });
});
