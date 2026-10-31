import { afterEach, describe, expect, it, vi } from "vitest";
import { dashboardInstallMetadata, dashboardManifest } from "./dashboard-install";
import { platformConsolePath } from "../platform-console-path";

afterEach(() => vi.unstubAllEnvs());
const business = { name: "Acme", logo: "/images/upload/acme.png", favicon: null, platform: false };

describe("dashboard installation contracts", () => {
  it.each(["https://acme.sponsor.krd", "https://customer.example"])("keeps Business launches on %s", (origin) => {
    const manifest = dashboardManifest(business, "/business");
    expect(manifest).toMatchObject({ id: "/business/", start_url: "/business/launch", scope: "/business/", display: "standalone" });
    expect(new URL(manifest.start_url!, origin).origin).toBe(origin);
    expect(manifest.icons?.[0].src).toBe(business.logo);
    expect(dashboardInstallMetadata(business.name, "/business").manifest).toBe("/business/manifest.webmanifest");
  });
  it("keeps platform app identity separate from public pages and inside its console scope", () => {
    const base = "/private-console-1234567890";
    const manifest = dashboardManifest({ ...business, platform: true }, base);
    expect(manifest).toMatchObject({ id: `${base}/`, start_url: `${base}/businesses`, scope: `${base}/` });
    expect(manifest.icons?.map((icon) => icon.sizes)).toEqual(["192x192", "512x512"]);
    expect(dashboardInstallMetadata("Sponsor.krd", base).appleWebApp).toMatchObject({ capable: true });
  });
  it("fails closed for invalid production console configuration", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PLATFORM_ADMIN_PATH", "invalid");
    expect(platformConsolePath()).toBeNull();
    vi.stubEnv("PLATFORM_ADMIN_PATH", "/private-console-1234567890/");
    expect(platformConsolePath()).toBe("/private-console-1234567890");
  });
});
