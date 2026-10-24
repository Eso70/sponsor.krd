import { afterEach, describe, expect, it, vi } from "vitest";
import { requestBranding } from "./request-branding.server";
const state = vi.hoisted(() => ({host: "alpha.example.test", resolve: vi.fn()}));
vi.mock("next/headers", () => ({headers: async () => new Headers({host: state.host})}));
vi.mock("@/lib/public/domain-routing", () => ({resolveBusinessHost: state.resolve}));
afterEach(() => {vi.unstubAllEnvs(); vi.restoreAllMocks(); state.resolve.mockReset();});
describe("request branding ownership", () => {
  it("does not share branding between businesses with different hosts", async () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "example.test");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const tenant = String(input).split("/").at(-1);
      return Response.json({website_color: tenant === "alpha" ? "#8754df" : "#00b4cc", name: tenant, logo: `/images/upload/${tenant}/logo.png`});
    });
    state.host = "alpha.example.test";
    expect(await requestBranding()).toMatchObject({name: "alpha", platform: false, accentColor: "#8754df"});
    state.host = "beta.example.test";
    expect(await requestBranding()).toMatchObject({name: "beta", platform: false, accentColor: "#00b4cc"});
  });
  it("uses verified domain mapping for customer domains", async () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "example.test");
    state.host = "customer.test";
    state.resolve.mockResolvedValue({subdomain: "alpha"});
    const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({name: "Alpha", website_color: "#123456"}));
    expect(await requestBranding()).toMatchObject({name: "Alpha", platform: false, accentColor: "#123456"});
    expect(state.resolve).toHaveBeenCalledWith("customer.test");
    expect(String(fetcher.mock.calls[0][0])).toContain("/subdomain-theme/alpha");
  });
  it("uses configured platform branding on platform hosts", async () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "example.test");
    state.host = "example.test";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({data: {name: "Platform", accentColor: "gradient:to-r:#111111:#222222"}}));
    expect(await requestBranding()).toMatchObject({platform: true, accentColor: "gradient:to-r:#111111:#222222"});
  });
  it("rejects invalid cursor colors from branding", async () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "example.test");
    state.host = "alpha.example.test";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({website_color: '"><script>alert(1)</script>'}));
    expect(await requestBranding()).toMatchObject({accentColor: "#25F4EE"});
  });

});
