import { describe, expect, it } from "vitest";
import { buildPlatformLinktreePayload } from "./platform-linktrees";

describe("buildPlatformLinktreePayload", () => {
  it("sends only fields accepted by CreateLinktreeDto", () => {
    const payload = buildPlatformLinktreePayload({
      headline: " Campaign ",
      logo: null,
      background_color: "#ffffff",
      templateKey: "spectrum",
      templateConfig: {},
      platforms: ["website"],
      links: { website: ["https://example.com"] },
    });

    expect(payload).toMatchObject({
      headline: "Campaign",
      background_color: "#ffffff",
      platforms: ["website"],
      links: { website: ["https://example.com"] },
    });
    expect(payload).not.toHaveProperty("templateKey");
    expect(payload).not.toHaveProperty("templateConfig");
    expect(payload).not.toHaveProperty("slug");
    expect(payload).not.toHaveProperty("seo_name");
    expect(payload.logo).toBeNull();
    expect(payload).toHaveProperty("template_config");
    expect(payload).not.toHaveProperty("footer_text");
    expect(payload).not.toHaveProperty("footer_phone");
    expect(payload).not.toHaveProperty("footer_hidden");
  });
});
