import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BusinessDomainsPanel } from "./BusinessDomainsPanel";
import { PlatformBusinessDomainsModal } from "@/features/platform-admin/components/PlatformBusinessDomainsModal";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { ApiRequestError } from "@/lib/api/request";
const { load, add, action } = vi.hoisted(() => ({
  load: vi.fn(),
  add: vi.fn(),
  action: vi.fn(),
}));
vi.mock("../api", async (original) => ({
  ...(await original<typeof import("../api")>()),
  loadDomains: load,
  addDomain: add,
  domainAction: action,
}));
const domain = {
  id: "domain-id",
  hostname: "wafaye.com",
  status: "pending" as const,
  isPrimary: false,
  verificationToken: "token",
  verifiedAt: null,
  checkedAt: null,
  lastError: null,
};
const data = {
  enabled: true,
  target: "domains.sponsor.krd",
  ipv4: ["203.0.113.10"],
  ipv6: [],
  subdomain: "wafaye",
  domains: [domain],
};
describe("shared custom-domain management", () => {
  it("clears the previous tenant and nested dialogs when platform selection changes", async () => {
    const { rerender } = render(
      <PlatformLocaleProvider initialLocale="en">
        <PlatformBusinessDomainsModal
          business={{ id: "wafaye-id", name: "Wafaye" }}
          onClose={vi.fn()}
        />
      </PlatformLocaleProvider>,
    );
    await screen.findAllByText("wafaye.com");
    fireEvent.click(
      screen.getAllByRole("button", { name: "DNS setup: wafaye.com" })[0],
    );
    expect(
      screen.getByDisplayValue("_sponsor-verification.wafaye.com"),
    ).toBeInTheDocument();
    load.mockResolvedValue({ ...data, subdomain: "other", domains: [] });
    rerender(
      <PlatformLocaleProvider initialLocale="en">
        <PlatformBusinessDomainsModal
          business={{ id: "other-id", name: "Other" }}
          onClose={vi.fn()}
        />
      </PlatformLocaleProvider>,
    );
    await screen.findByText("No custom domains connected");
    expect(
      screen.queryByDisplayValue("_sponsor-verification.wafaye.com"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("wafaye.com")).not.toBeInTheDocument();
    expect(load).toHaveBeenLastCalledWith(
      "/api/platform/businesses/other-id/domains",
      expect.any(AbortSignal),
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  beforeEach(() => {
    vi.resetAllMocks();
    load.mockResolvedValue(data);
    add.mockResolvedValue(data);
    action.mockResolvedValue({
      ...data,
      domains: [{ ...domain, status: "active" }],
    });
  });
  it.each(["panel", "platform"] as const)(
    "updates primary selection through the %s integration",
    async (surface) => {
      load.mockResolvedValue({
        ...data,
        domains: [{ ...domain, status: "active" }],
      });
      const result = {
        ...data,
        domains: [{ ...domain, status: "active", isPrimary: true }],
      };
      action.mockResolvedValue(result);
      render(
        surface === "panel" ? (
          <BusinessDomainsPanel
            businessId="wafaye-id"
            businessName="Wafaye"
            onClose={vi.fn()}
            locale="en"
          />
        ) : (
          <PlatformLocaleProvider initialLocale="en">
            <PlatformBusinessDomainsModal
              business={{ id: "wafaye-id", name: "Wafaye" }}
              onClose={vi.fn()}
            />
          </PlatformLocaleProvider>
        ),
      );
      await screen.findAllByText("wafaye.com");
      fireEvent.click(
        screen.getAllByRole("button", { name: "Make primary: wafaye.com" })[0],
      );
      await waitFor(() => expect(action).toHaveBeenCalled());
      await waitFor(() =>
        expect(screen.getAllByText(/Primary/).length).toBeGreaterThan(0),
      );
    },
  );
  it.each(["panel", "platform"] as const)(
    "loads the same panel through the %s integration",
    async (surface) => {
      if (surface === "panel")
        render(
          <BusinessDomainsPanel
            businessId="wafaye-id"
            businessName="Wafaye"
            onClose={vi.fn()}
            locale="en"
          />,
        );
      else
        render(
          <PlatformLocaleProvider initialLocale="en">
            <PlatformBusinessDomainsModal
              business={{ id: "wafaye-id", name: "Wafaye" }}
              onClose={vi.fn()}
            />
          </PlatformLocaleProvider>,
        );
      await screen.findAllByText("wafaye.com");
      expect(load.mock.calls[0][0]).toBe(
        "/api/platform/businesses/wafaye-id/domains",
      );
      expect(screen.getByRole("button", { name: "Add domain" })).toBeDisabled();
      expect(
        screen.getByText(/Remove it before connecting a different domain/),
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole("button", { name: "Make primary: wafaye.com" })[0],
      ).toBeDisabled();
      fireEvent.click(
        screen.getAllByRole("button", { name: "Verify DNS: wafaye.com" })[0],
      );
      await waitFor(() =>
        expect(action).toHaveBeenCalledWith(
          load.mock.calls[0][0],
          "domain-id",
          "verify",
        ),
      );
      expect(
        await screen.findByDisplayValue("sponsor-verification=token"),
      ).toBeInTheDocument();
    },
  );
  it("adds through a shared modal and shows exact ownership records", async () => {
    load.mockResolvedValue({ ...data, domains: [] });
    render(
      <BusinessDomainsPanel
        businessId="wafaye-id"
        businessName="Wafaye"
        onClose={vi.fn()}
        locale="en"
      />,
    );
    await screen.findByText("No custom domains connected");
    fireEvent.click(screen.getByRole("button", { name: "Add domain" }));
    const modal = within(screen.getByRole("dialog", { name: "Add domain" }));
    fireEvent.change(modal.getByRole("textbox", { name: "Domain" }), {
      target: { value: "WAFAYE.com" },
    });
    fireEvent.click(modal.getByRole("button", { name: "Add domain" }));
    await waitFor(() =>
      expect(add).toHaveBeenCalledWith(
        "/api/platform/businesses/wafaye-id/domains",
        "wafaye.com",
      ),
    );
    expect(
      await screen.findByDisplayValue("_sponsor-verification.wafaye.com"),
    ).toBeInTheDocument();
  });
  it("hides mutation controls for a read-only management panel", async () => {
    render(
      <BusinessDomainsPanel
        businessId="wafaye-id"
        businessName="Wafaye"
        onClose={vi.fn()}
        locale="en"
        canManage={false}
      />,
    );
    await screen.findAllByText("wafaye.com");
    expect(
      screen.queryByRole("button", { name: "Add domain" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove: wafaye.com" }),
    ).not.toBeInTheDocument();
  });
  it("shows the administrator setup requirement when disabled", async () => {
    load.mockResolvedValue({ ...data, enabled: false });
    render(
      <BusinessDomainsPanel
        businessId="wafaye-id"
        businessName="Wafaye"
        onClose={vi.fn()}
        locale="en"
      />,
    );
    await screen.findAllByText("wafaye.com");
    expect(screen.getByRole("button", { name: "Add domain" })).toBeDisabled();
    expect(
      screen.getByText(/enabled by the platform administrator/),
    ).toBeInTheDocument();
  });
  it.each(["panel", "platform"] as const)(
    "automatically refreshes the domain in the %s integration and stops when verified",
    async (surface) => {
      vi.useFakeTimers();
      load.mockResolvedValue(data);
      let unmount: () => void = () => {};
      await act(async () => {
        const rendered = render(
          surface === "panel" ? (
            <BusinessDomainsPanel
              businessId="wafaye-id"
              businessName="Wafaye"
              onClose={vi.fn()}
              locale="en"
            />
          ) : (
            <PlatformLocaleProvider initialLocale="en">
              <PlatformBusinessDomainsModal
                business={{ id: "wafaye-id", name: "Wafaye" }}
                onClose={vi.fn()}
              />
            </PlatformLocaleProvider>
          ),
        );
        unmount = rendered.unmount;
      });
      expect(
        screen.getByText(/DNS is checked automatically/),
      ).toBeInTheDocument();
      load.mockResolvedValue({
        ...data,
        domains: [{ ...domain, status: "active" }],
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(15000);
      });
      expect(load).toHaveBeenCalledTimes(2);
      expect(load.mock.calls[1][0]).toBe(
        "/api/platform/businesses/wafaye-id/domains",
      );
      expect(
        screen.queryByText(/DNS is checked automatically/),
      ).not.toBeInTheDocument();
      expect(
        screen.getAllByRole("button", { name: "Make primary: wafaye.com" })[0],
      ).toBeEnabled();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30000);
      });
      expect(load).toHaveBeenCalledTimes(2);
      unmount();
    },
  );
  it("does not refresh a hidden dashboard or overlap pending requests", async () => {
    vi.useFakeTimers();
    const visibility = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");
    let unmount: () => void = () => {};
    await act(async () => {
      unmount = render(
        <BusinessDomainsPanel
          businessId="wafaye-id"
          businessName="Wafaye"
          onClose={vi.fn()}
          locale="en"
        />,
      ).unmount;
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });
    expect(load).toHaveBeenCalledTimes(1);
    visibility.mockReturnValue("visible");
    load.mockImplementation(() => new Promise(() => {}));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(45000);
    });
    expect(load).toHaveBeenCalledTimes(2);
    const signal = load.mock.calls[1][1] as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
  });
  it("explains a concurrent domain assignment in the add modal", async () => {
    load.mockResolvedValue({ ...data, domains: [] });
    add.mockRejectedValue(
      new ApiRequestError("Domain limit reached", {
        status: 409,
        code: "CUSTOM_DOMAIN_LIMIT",
      }),
    );
    render(
      <BusinessDomainsPanel
        businessId="wafaye-id"
        businessName="Wafaye"
        onClose={vi.fn()}
        locale="en"
      />,
    );
    await screen.findByText("No custom domains connected");
    fireEvent.click(screen.getByRole("button", { name: "Add domain" }));
    const modal = within(screen.getByRole("dialog", { name: "Add domain" }));
    fireEvent.change(modal.getByRole("textbox", { name: "Domain" }), {
      target: { value: "second.com" },
    });
    fireEvent.click(modal.getByRole("button", { name: "Add domain" }));
    expect(await modal.findByRole("alert")).toHaveTextContent(
      "Remove it before connecting a different domain",
    );
  });
  it.each(["panel", "platform"] as const)(
    "keeps the delete confirmation above %s management and restores the empty domain state",
    async (surface) => {
      const close = vi.fn();
      load.mockResolvedValue({
        ...data,
        domains: [{ ...domain, status: "active", isPrimary: true }],
      });
      action.mockResolvedValue({ ...data, domains: [] });
      render(
        surface === "panel" ? (
          <BusinessDomainsPanel
            businessId="wafaye-id"
            businessName="Wafaye"
            onClose={vi.fn()}
            locale="en"
          />
        ) : (
          <PlatformLocaleProvider initialLocale="en">
            <PlatformBusinessDomainsModal
              business={{ id: "wafaye-id", name: "Wafaye" }}
              onClose={close}
            />
          </PlatformLocaleProvider>
        ),
      );
      await screen.findAllByText("wafaye.com");
      const trigger = screen.getAllByRole("button", {
        name: "Remove: wafaye.com",
      })[0];
      trigger.focus();
      fireEvent.click(trigger);
      const dialog = screen.getByRole("dialog", { name: "Remove domain?" });
      expect(dialog.parentElement).toHaveClass("z-[160]");
      expect(dialog).toHaveFocus();
      expect(
        within(dialog).getByText(
          /automatically return to its default Sponsor.krd address/,
        ),
      ).toBeInTheDocument();
      fireEvent.keyDown(document, { key: "Escape" });
      expect(
        screen.queryByRole("dialog", { name: "Remove domain?" }),
      ).not.toBeInTheDocument();
      expect(close).not.toHaveBeenCalled();
      expect(trigger).toHaveFocus();
      fireEvent.click(trigger);
      fireEvent.click(
        within(
          screen.getByRole("dialog", { name: "Remove domain?" }),
        ).getByRole("button", { name: "Remove" }),
      );
      await screen.findByText("No custom domains connected");
      expect(action).toHaveBeenCalledWith(
        "/api/platform/businesses/wafaye-id/domains",
        "domain-id",
        "remove",
      );
      expect(
        screen.queryByRole("dialog", { name: "Remove domain?" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add domain" })).toBeEnabled();
      if (surface === "platform")
        expect(
          screen.getByRole("dialog", { name: "Custom domains: Wafaye" }),
        ).toBeInTheDocument();
    },
  );
  it.each(["panel", "platform"] as const)(
    "shows the current server DNS failure instead of an old ownership failure on %s",
    async (surface) => {
      load.mockResolvedValue({
        ...data,
        domains: [{ ...domain, lastError: "ownership" }],
      });
      action.mockRejectedValue(
        new ApiRequestError("DNS unavailable", {
          status: 503,
          code: "SERVICE_UNAVAILABLE",
        }),
      );
      render(
        surface === "panel" ? (
          <BusinessDomainsPanel
            businessId="wafaye-id"
            businessName="Wafaye"
            onClose={vi.fn()}
            locale="en"
          />
        ) : (
          <PlatformLocaleProvider initialLocale="en">
            <PlatformBusinessDomainsModal
              business={{ id: "wafaye-id", name: "Wafaye" }}
              onClose={vi.fn()}
            />
          </PlatformLocaleProvider>
        ),
      );
      await screen.findAllByText("wafaye.com");
      fireEvent.click(
        screen.getAllByRole("button", { name: "DNS setup: wafaye.com" })[0],
      );
      const modal = within(screen.getAllByRole("dialog").at(-1)!);
      expect(
        modal.getByText(/ownership TXT record is missing/),
      ).toBeInTheDocument();
      fireEvent.click(modal.getByRole("button", { name: "Verify DNS" }));
      expect(
        await modal.findByText(/server could not complete the DNS lookup/),
      ).toBeInTheDocument();
      expect(
        modal.queryByText(/ownership TXT record is missing/),
      ).not.toBeInTheDocument();
    },
  );
});
