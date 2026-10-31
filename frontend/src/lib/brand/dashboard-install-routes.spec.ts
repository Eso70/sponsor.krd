// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as businessManifest } from "@/app/business/manifest.webmanifest/route";
import { GET as platformManifest } from "@/app/[platformConsole]/manifest.webmanifest/route";
import { generateMetadata as businessMetadata } from "@/app/business/layout";
import { generateMetadata as platformMetadata } from "@/app/[platformConsole]/layout";
import publicManifest from "./public-manifest";

const state = vi.hoisted(() => ({ platform: false }));
vi.mock("@/lib/brand/request-branding.server", () => ({ requestBranding: async () => ({ platform: state.platform, name: "Acme", logo: null, favicon: null }) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined, has: () => false }) }));
afterEach(() => { vi.unstubAllEnvs(); state.platform = false; });
const base = "/private-console-1234567890";
const context = (segment = base.slice(1)) => ({ params: Promise.resolve({ platformConsole: segment }) });

describe("dashboard manifest routing and metadata", () => {
  it("links Business pages to their own manifest while public installs keep their home URL", async () => {
    expect((await businessMetadata()).manifest).toBe("/business/manifest.webmanifest");
    const response = await businessManifest();
    expect(response.headers.get("content-type")).toBe("application/manifest+json");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.json()).toMatchObject({ start_url: "/business/launch" });
    expect((await publicManifest()).start_url).toBe("/");
  });
  it("links Platform metadata to the configured console manifest without exposing it in the public manifest", async () => {
    state.platform = true;
    vi.stubEnv("PLATFORM_ADMIN_PATH", base);
    expect((await platformMetadata()).manifest).toBe(`${base}/manifest.webmanifest`);
    expect(await (await platformManifest(new Request("https://sponsor.krd"), context())).json()).toMatchObject({ start_url: `${base}/businesses`, scope: `${base}/` });
    expect(JSON.stringify(await publicManifest())).not.toContain(base);
    expect((await businessManifest()).status).toBe(404);
  });
  it("rejects wrong console paths and tenant requests for a platform manifest", async () => {
    vi.stubEnv("PLATFORM_ADMIN_PATH", base);
    expect((await platformManifest(new Request("https://sponsor.krd"), context("wrong"))).status).toBe(404);
    expect((await platformManifest(new Request("https://customer.example"), context())).status).toBe(404);
  });
});
