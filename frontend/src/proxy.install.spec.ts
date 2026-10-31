// @vitest-environment node
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/public/domain-routing", () => ({ resolveBusinessHost: vi.fn().mockResolvedValue(null) }));
let proxy: typeof import("./proxy").proxy;
const consoleBase = "/install-fixture-console-12345";
function request(host: string, path: string) {
  return new NextRequest(`https://${host}${path}`, { headers: { host } });
}
beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "example.test");
  vi.stubEnv("PLATFORM_ADMIN_PATH", consoleBase);
  vi.resetModules();
  ({ proxy } = await import("./proxy"));
});
afterEach(() => vi.restoreAllMocks());
afterAll(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe("installed dashboard entry routing", () => {
  it.each(["/business/manifest.webmanifest", "/business/launch"])("allows public tenant install entry %s without exposing dashboard routes", async (path) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
    expect((await proxy(request("acme.example.test", path))).status).toBe(200);
    expect((await proxy(request("acme.example.test", "/business/pages"))).status).toBe(404);
    expect((await proxy(request("example.test", path))).status).toBe(404);
  });
  it("serves the known platform manifest without a session but still protects console launch", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch");
    const manifest = await proxy(request("example.test", `${consoleBase}/manifest.webmanifest`));
    expect(manifest.status).toBe(200);
    expect(manifest.headers.get("cache-control")).toContain("no-store");
    expect(fetcher).not.toHaveBeenCalled();
    const launch = await proxy(request("example.test", `${consoleBase}/`));
    expect(new URL(launch.headers.get("location")!).pathname).toBe(`${consoleBase}/login`);
    vi.mocked(fetcher).mockResolvedValue(new Response(null));
    expect((await proxy(request("acme.example.test", `${consoleBase}/manifest.webmanifest`))).status).toBe(404);
  });
});
