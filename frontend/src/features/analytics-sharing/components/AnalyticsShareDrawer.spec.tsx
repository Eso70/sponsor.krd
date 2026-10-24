import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsShareDrawer } from "./AnalyticsShareDrawer";
import { sharingCopy } from "../sharing-copy";
const request = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/request", () => ({ apiRequest: request }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const link = {
  id: "share",
  url: "https://sponsor.krd/analytics-share/share",
  createdAt: "2026-10-20T00:00:00Z",
  expiresAt: null,
  disabled: false,
  canRevealCode: true,
};
beforeEach(() => request.mockReset());
it.each([true, false])(
  "defaults to including form answers and respects the owner setting (%s)",
  async (includeSubmissions) => {
    request.mockImplementation(async (_url, options) =>
      options?.method === "POST"
        ? { ...link, code: "123456", includeSubmissions: true }
        : [],
    );
    render(
      <AnalyticsShareDrawer
        apiBase="/api/forms/page/analytics-shares"
        locale="en"
        pageType="form"
        onClose={vi.fn()}
      />,
    );
    const toggle = screen.getByRole("switch", {
      name: "Include form responses",
    });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Create link" })).toBeEnabled(),
    );
    if (!includeSubmissions) fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: "Create link" }));
    await screen.findByText("123456");
    expect(request).toHaveBeenCalledWith("/api/forms/page/analytics-shares", {
      method: "POST",
      json: { expiry: "never", locale: "en", includeSubmissions },
    });
  },
);
describe.each(["en", "ar", "ckb"] as const)(
  "analytics share management (%s)",
  (locale) => {
    it("creates a non-expiring link by default and can disable and delete it", async () => {
      request.mockImplementation(async (_url, options) =>
        options?.method === "POST" ? { ...link, code: "001234" } : [],
      );
      const copy = sharingCopy(locale);
      render(
        <AnalyticsShareDrawer
          apiBase="/api/forms/page/analytics-shares"
          locale={locale}
          onClose={vi.fn()}
        />,
      );
      const create = screen.getByRole("button", { name: copy.create });
      await waitFor(() => expect(create).toBeEnabled());
      expect(
        screen.getByRole("button", { name: new RegExp(copy.never) }),
      ).toBeInTheDocument();
      fireEvent.click(create);
      const code = await screen.findByText("001234");
      expect(code.closest("section")).toBe(
        screen.getByRole("textbox", { name: copy.copyLink }).closest("section"),
      );
      expect(request).toHaveBeenCalledWith("/api/forms/page/analytics-shares", {
        method: "POST",
        json: { expiry: "never", locale },
      });
      fireEvent.click(screen.getByRole("button", { name: copy.disable }));
      await screen.findByText(copy.disabled);
      expect(screen.queryByText("001234")).not.toBeInTheDocument();
      expect(request).toHaveBeenCalledWith(
        "/api/forms/page/analytics-shares/share/disable",
        { method: "POST" },
      );
      fireEvent.click(screen.getByRole("button", { name: copy.remove }));
      const confirmation = screen.getByRole("dialog", { name: copy.deleteTitle });
      expect(request).not.toHaveBeenCalledWith("/api/forms/page/analytics-shares/share", { method: "DELETE" });
      fireEvent.click(within(confirmation).getByRole("button", { name: copy.remove }));
      await screen.findByText(copy.empty);
      expect(request).toHaveBeenCalledWith(
        "/api/forms/page/analytics-shares/share",
        { method: "DELETE" },
      );
    });
  },
);

it("retrieves a saved code once more and removes the recovery action after hiding it", async () => {
  request.mockImplementation(async (_url, options) =>
    options?.method === "POST" ? { code: "001234" } : [link],
  );
  render(
    <AnalyticsShareDrawer
      apiBase="/api/forms/page/analytics-shares"
      locale="en"
      onClose={vi.fn()}
    />,
  );
  const reveal = await screen.findByRole("button", {
    name: "Show code one more time",
  });
  fireEvent.click(reveal);
  await screen.findByText("001234");
  expect(request).toHaveBeenCalledWith(
    "/api/forms/page/analytics-shares/share/code",
    { method: "POST" },
  );
  fireEvent.click(screen.getByRole("button", { name: "Hide code" }));
  expect(screen.queryByText("001234")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Show code one more time" }),
  ).not.toBeInTheDocument();
});

it("supports a preset when the owner chooses to add an expiry", async () => {
  request.mockImplementation(async (_url, options) =>
    options?.method === "POST" ? { ...link, code: "123456" } : [],
  );
  render(
    <AnalyticsShareDrawer
      apiBase="/api/forms/page/analytics-shares"
      locale="en"
      onClose={vi.fn()}
    />,
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Create link" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: /No expiration/ }));
  fireEvent.click(screen.getByRole("option", { name: "7 days" }));
  fireEvent.click(screen.getByRole("button", { name: "Create link" }));
  await screen.findByText("123456");
  expect(request).toHaveBeenCalledWith("/api/forms/page/analytics-shares", {
    method: "POST",
    json: { expiry: "week", locale: "en" },
  });
});

it("changes the drawer language without discarding its links and uses the compact theme control", async () => {
  request.mockImplementation(async (_url, options) =>
    options?.method === "POST" ? { code: "123456" } : [link],
  );
  render(
    <AnalyticsShareDrawer apiBase="/shares" locale="en" onClose={vi.fn()} />,
  );
  await screen.findByRole("button", { name: "Show code one more time" });
  const language = document.querySelector<HTMLButtonElement>(
    "[data-language-toggle]",
  )!;
  expect(language).toHaveClass("!size-9");
  expect(screen.getByRole("button", { name: "Change theme" })).toHaveClass(
    "!size-9",
  );
  fireEvent.click(language);
  const copy = sharingCopy("ckb");
  expect(
    screen.getByRole("button", { name: copy.showCode }),
  ).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: copy.copyLink })).toHaveValue(
    link.url,
  );
  expect(request).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: copy.showCode }));
  await screen.findByText("123456");
  expect(request).toHaveBeenCalledWith("/shares/share/code", {
    method: "POST",
  });
});

it.each(["/api/linktrees/page/analytics-shares", "/api/platform/linktrees/page/analytics-shares", "/api/forms/page/analytics-shares", "/api/platform/forms/page/analytics-shares"])("cancels deletion and retries a failure without losing the share in %s", async (apiBase) => {
  request.mockImplementation(async (_url, options) => {
    if (options?.method === "DELETE") throw new Error("Denied");
    return [link];
  });
  render(<AnalyticsShareDrawer apiBase={apiBase} locale="en" onClose={vi.fn()} />);
  const copy = sharingCopy("en");
  fireEvent.click(await screen.findByRole("button", { name: copy.remove }));
  let dialog = screen.getByRole("dialog", { name: copy.deleteTitle });
  fireEvent.click(within(dialog).getByRole("button", { name: copy.cancel }));
  expect(request).not.toHaveBeenCalledWith(`${apiBase}/share`, { method: "DELETE" });
  expect(screen.queryByRole("dialog", { name: copy.deleteTitle })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: copy.remove }));
  dialog = screen.getByRole("dialog", { name: copy.deleteTitle });
  fireEvent.click(within(dialog).getByRole("button", { name: copy.remove }));
  await waitFor(() => expect(within(dialog).getByRole("button", { name: copy.remove })).toBeEnabled());
  expect(screen.getByRole("textbox", { name: copy.copyLink })).toHaveValue(link.url);
  request.mockImplementation(async (_url, options) => options?.method === "DELETE" ? {} : [link]);
  fireEvent.click(within(dialog).getByRole("button", { name: copy.remove }));
  await screen.findByText(copy.empty);
  expect(screen.queryByRole("dialog", { name: copy.deleteTitle })).not.toBeInTheDocument();
});
