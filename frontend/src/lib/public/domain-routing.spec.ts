// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveBusinessHost } from "./domain-routing";

describe("domain resolver trust", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
  it("fails closed when no internal key is configured", async () => {
    vi.stubEnv("INTERNAL_PROXY_SECRET", "");
    vi.stubEnv("SESSION_SECRET", "");
    const fetch = vi.spyOn(globalThis, "fetch");
    await expect(resolveBusinessHost("wafaye.sponsor.krd")).rejects.toThrow(
      "not configured",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
