"use client";

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { BusinessDomain, BusinessDomains } from "@linktree/types";
import { DomainDnsModal } from "./DomainDnsModal";
import { domainDnsCopy } from "../dns-copy";

const domain: BusinessDomain = {
  id: "domain",
  hostname: "shop.example.co.uk",
  status: "pending",
  isPrimary: false,
  verificationToken: "proof",
  verifiedAt: null,
  checkedAt: null,
  lastError: null,
};
const config: BusinessDomains = {
  enabled: true,
  target: "domains.sponsor.krd",
  ipv4: ["203.0.113.10", "203.0.113.11"],
  ipv6: [],
  subdomain: "shop",
  domains: [domain],
};
const callbacks = () => ({
  onClose: vi.fn(),
  onVerify: vi.fn(),
  onPrimary: vi.fn(),
});

describe("custom-domain DNS setup", () => {
  it.each(["en", "ar", "ckb"] as const)(
    "shows all configured routing records and exact ownership in %s",
    (locale) => {
      render(
        <DomainDnsModal
          domain={domain}
          config={config}
          locale={locale}
          busy={false}
          canManage
          {...callbacks()}
        />,
      );
      expect(screen.getByDisplayValue("203.0.113.10")).toBeInTheDocument();
      expect(screen.getByDisplayValue("203.0.113.11")).toBeInTheDocument();
      expect(screen.getAllByDisplayValue("shop.example.co.uk")).toHaveLength(2);
      expect(
        screen.getByDisplayValue("_sponsor-verification.shop.example.co.uk"),
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("sponsor-verification=proof"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(domainDnsCopy[locale].noIpv6),
      ).toBeInTheDocument();
      expect(screen.getByText(domainDnsCopy[locale].names)).toBeInTheDocument();
      expect(
        screen.getByText(domainDnsCopy[locale].maintainHelp),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(6);
    },
  );
  it("shows IPv6 records and never tells an IPv6-only deployment to remove them", () => {
    render(
      <DomainDnsModal
        domain={domain}
        config={{ ...config, ipv4: [], ipv6: ["2001:db8::1"] }}
        locale="en"
        busy={false}
        canManage
        {...callbacks()}
      />,
    );
    expect(screen.getByDisplayValue("2001:db8::1")).toBeInTheDocument();
    expect(screen.getByText(domainDnsCopy.en.noIpv4)).toBeInTheDocument();
    expect(screen.queryByText(domainDnsCopy.en.noIpv6)).not.toBeInTheDocument();
  });
  it("explains incomplete configuration and disables verification", () => {
    render(
      <DomainDnsModal
        domain={domain}
        config={{ ...config, enabled: false, ipv4: [] }}
        locale="en"
        busy={false}
        canManage
        {...callbacks()}
      />,
    );
    expect(screen.getByText(domainDnsCopy.en.noAddresses)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify DNS" })).toBeDisabled();
  });
  it("requires verification before activation and uses the existing primary action", () => {
    const actions = callbacks();
    const { rerender } = render(
      <DomainDnsModal
        domain={domain}
        config={config}
        locale="en"
        busy={false}
        canManage
        {...actions}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Verify DNS" }));
    expect(actions.onVerify).toHaveBeenCalledOnce();
    expect(
      screen.queryByRole("button", { name: "Make primary" }),
    ).not.toBeInTheDocument();
    rerender(
      <DomainDnsModal
        domain={{ ...domain, status: "active" }}
        config={config}
        locale="en"
        busy={false}
        canManage
        {...actions}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      domainDnsCopy.en.verified,
    );
    fireEvent.click(screen.getByRole("button", { name: "Make primary" }));
    expect(actions.onPrimary).toHaveBeenCalledOnce();
    rerender(
      <DomainDnsModal
        domain={{ ...domain, status: "disconnected", lastError: "routing" }}
        config={config}
        locale="en"
        busy={false}
        canManage
        {...actions}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      domainDnsCopy.en.disconnected,
    );
    expect(screen.getByRole("button", { name: "Verify DNS" })).toBeEnabled();
  });
  it("keeps instructions available to read-only users without mutation controls", () => {
    render(
      <DomainDnsModal
        domain={domain}
        config={config}
        locale="en"
        busy={false}
        canManage={false}
        {...callbacks()}
      />,
    );
    expect(screen.getByDisplayValue("203.0.113.10")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Verify DNS" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Make primary" }),
    ).not.toBeInTheDocument();
  });
});
