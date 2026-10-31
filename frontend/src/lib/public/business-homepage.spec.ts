// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchBusinessHomepage } from "./public-page.server";

const state = vi.hoisted(() => ({ host: "one.lvh.me:3011" }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: state.host, "x-subdomain": "forged" }) }));
vi.mock("./domain-routing", () => ({ resolveBusinessHost: async () => ({ subdomain: "one", isCustom: state.host === "custom.example", primaryHostname: state.host === "custom.example" ? "custom.example" : null }) }));

describe("business homepage resolution", () => {
  beforeEach(() => {
    state.host = "one.lvh.me:3011";
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "lvh.me:3011");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://lvh.me:3011");
    vi.stubEnv("INTERNAL_PROXY_SECRET", "fixture-secret");
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it.each([false, undefined])("keeps the normal homepage when disabled (%s)", async (enabled) => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ data: { id: "one", homepage_linktree: enabled, default_linktree_slug: "chosen" } }));
    vi.stubGlobal("fetch", fetch);
    expect(await fetchBusinessHomepage()).toMatchObject({ linktree: null });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it.each(["one.lvh.me:3011", "custom.example"])("loads the owner's actual default slug on %s", async (host) => {
    state.host = host;
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json({ data: { homepage_linktree: true, default_linktree_slug: "chosen" } }))
      .mockResolvedValueOnce(Response.json({ data: { linktree: { id: "page", seo_name: "chosen" }, links: [] } }));
    vi.stubGlobal("fetch", fetch);
    expect(await fetchBusinessHomepage()).toMatchObject({ linktree: { linktree: { id: "page" }, subdomain: "one" } });
    expect(fetch.mock.calls[1][0]).toContain("/api/public/linktree/chosen");
    expect(fetch.mock.calls[1][1]).toMatchObject({ cache: "no-store", headers: { "x-subdomain": "one" } });
  });
  it.each([null, "removed"])("falls back when no accessible default remains (%s)", async (slug) => {
    const fetch = vi.fn().mockResolvedValueOnce(Response.json({ data: { homepage_linktree: true, default_linktree_slug: slug } })).mockResolvedValueOnce(new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", fetch);
    expect(await fetchBusinessHomepage()).toMatchObject({ linktree: null });
  });
  it("does not select a business Linktree on the platform root", async () => {
    state.host = "lvh.me:3011";
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect(await fetchBusinessHomepage()).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
