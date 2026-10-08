// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BusinessDomains } from "@linktree/types";
import { openSelectedBusinessWorkspace } from "./domain-navigation";
const data: BusinessDomains = {
  enabled: true,
  target: "domains.sponsor.krd",
  ipv4: [],
  ipv6: [],
  subdomain: "eso",
  domains: [],
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("business dashboard host changes", () => {
  it("opens custom-host sign-in after activation", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://sponsor.krd");
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "sponsor.krd");
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { host: "eso.sponsor.krd", assign } });
    openSelectedBusinessWorkspace({
      ...data,
      domains: [
        {
          id: "id",
          hostname: "zhirsaz.com",
          isPrimary: true,
          status: "active",
          verificationToken: "token",
          verifiedAt: null,
          checkedAt: null,
          lastError: null,
        },
      ],
    });
    expect(assign).toHaveBeenCalledWith(
      "https://zhirsaz.com/business/workspace-entry",
    );
  });
  it("opens default-host sign-in after removing the primary", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://sponsor.krd");
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "sponsor.krd");
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { host: "zhirsaz.com", assign } });
    openSelectedBusinessWorkspace(data);
    expect(assign).toHaveBeenCalledWith(
      "https://eso.sponsor.krd/business/workspace-entry",
    );
  });
  it("does not navigate when the current hostname still works", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://sponsor.krd");
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "sponsor.krd");
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { host: "eso.sponsor.krd", assign } });
    openSelectedBusinessWorkspace(data);
    expect(assign).not.toHaveBeenCalled();
  });
});
