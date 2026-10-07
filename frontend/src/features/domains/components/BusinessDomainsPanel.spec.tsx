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
  it.each(["business", "platform"] as const)(
    "loads the same panel through the %s integration",
    async (surface) => {
      if (surface === "business")
        render(
          <BusinessDomainsPanel scope={{ surface: "business" }} locale="en" />,
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
        surface === "business"
          ? "/api/business/domains"
          : "/api/platform/businesses/wafaye-id/domains",
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
      <BusinessDomainsPanel scope={{ surface: "business" }} locale="en" />,
    );
    await screen.findByText("No custom domains connected");
    fireEvent.click(screen.getByRole("button", { name: "Add domain" }));
    const modal = within(screen.getByRole("dialog"));
    fireEvent.change(modal.getByRole("textbox", { name: "Domain" }), {
      target: { value: "WAFAYE.com" },
    });
    fireEvent.click(modal.getByRole("button", { name: "Add domain" }));
    await waitFor(() =>
      expect(add).toHaveBeenCalledWith("/api/business/domains", "wafaye.com"),
    );
    expect(
      await screen.findByDisplayValue("_sponsor-verification.wafaye.com"),
    ).toBeInTheDocument();
  });
  it("hides mutation controls for a read-only business member", async () => {
    render(
      <BusinessDomainsPanel
        scope={{ surface: "business" }}
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
      <BusinessDomainsPanel scope={{ surface: "business" }} locale="en" />,
    );
    await screen.findAllByText("wafaye.com");
    expect(screen.getByRole("button", { name: "Add domain" })).toBeDisabled();
    expect(
      screen.getByText(/enabled by the platform administrator/),
    ).toBeInTheDocument();
  });
  it.each(["business", "platform"] as const)(
    "automatically refreshes the domain in the %s integration and stops when verified",
    async (surface) => {
      vi.useFakeTimers();
      load.mockResolvedValue(data);
      let unmount: () => void = () => {};
      await act(async () => {
        const rendered = render(
          surface === "business" ? (
            <BusinessDomainsPanel scope={{ surface: "business" }} locale="en" />
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
        surface === "business"
          ? "/api/business/domains"
          : "/api/platform/businesses/wafaye-id/domains",
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
        <BusinessDomainsPanel scope={{ surface: "business" }} locale="en" />,
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
      <BusinessDomainsPanel scope={{ surface: "business" }} locale="en" />,
    );
    await screen.findByText("No custom domains connected");
    fireEvent.click(screen.getByRole("button", { name: "Add domain" }));
    const modal = within(screen.getByRole("dialog"));
    fireEvent.change(modal.getByRole("textbox", { name: "Domain" }), {
      target: { value: "second.com" },
    });
    fireEvent.click(modal.getByRole("button", { name: "Add domain" }));
    expect(await modal.findByRole("alert")).toHaveTextContent(
      "Remove it before connecting a different domain",
    );
  });
});
