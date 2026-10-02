import { describe, it, expect } from "vitest";
import type { PublicLinktree } from "@linktree/types";
import { LINKTREE_DEFAULT_DESCRIPTION } from "@linktree/types";
import { NON_DESCRIPTIVE_PAGE_TEXT } from "@linktree/types";
import { NON_DESCRIPTIVE_PAGE_TEXT as backendStarterText } from "../../../../backend/src/common/page-seo";
import { buildPageMetadata, canonicalPageUrl, isPageIndexable, serializeJsonLd, publicAssetUrl } from "./page-seo";
import { resolvePublicOrigin } from "./public-origin";
import { sitemapXml, sitemapIndexXml } from "./sitemap";

const page = { name: "Real business", uid: "random-id", seo_name: "business", subtitle: "Services provided by this business", description: "Actual description", template_config: {} } as PublicLinktree;

describe("public SEO boundary", () => {
  it("keeps indexing policy aligned across SQL/server/frontend and all UI languages", () => {
    expect(backendStarterText).toEqual(NON_DESCRIPTIVE_PAGE_TEXT);
    for (const description of NON_DESCRIPTIVE_PAGE_TEXT) {
      expect(isPageIndexable({ ...page, subtitle: "", description })).toBe(false);
    }
  });
  it("isolates identical slugs on distinct validated hosts", () => {
    const a = resolvePublicOrigin("a.sponsor.krd:443", "sponsor.krd", "https://sponsor.krd")!;
    const b = resolvePublicOrigin("b.sponsor.krd", "sponsor.krd", "https://sponsor.krd")!;
    expect(canonicalPageUrl(page, a.origin)).toBe("https://a.sponsor.krd/linktree/business");
    expect(canonicalPageUrl(page, b.origin)).toBe("https://b.sponsor.krd/linktree/business");
    expect(resolvePublicOrigin("a.evil.test", "sponsor.krd", "https://sponsor.krd")).toBeNull();
    expect(resolvePublicOrigin("nested.a.sponsor.krd", "sponsor.krd", "https://sponsor.krd")).toBeNull();
    expect(resolvePublicOrigin("localhost", "sponsor.krd", "https://sponsor.krd")).toBeNull();
  });
  it("normalizes case/trailing dots and keeps configuration-owned ports", () => {
    expect(resolvePublicOrigin("A.SPONSOR.KRD.:9999", "sponsor.krd", "https://sponsor.krd")?.origin).toBe("https://a.sponsor.krd");
    expect(resolvePublicOrigin("a.localhost:3012", "localhost:3012", "http://localhost:3012")?.origin).toBe("http://a.localhost:3012");
  });
  it("generates full metadata from actual content and ignores canonical injection", () => {
    const metadata = buildPageMetadata({ ...page, template_config: { seo: { title: "Chosen title", canonicalUrl: "https://evil.test", robotsIndex: false } } }, "https://a.sponsor.krd");
    expect(metadata.title).toEqual({ absolute: "Chosen title" });
    expect(metadata.description).toBe("Actual description");
    expect(metadata.alternates?.canonical).toBe("https://a.sponsor.krd/linktree/business");
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });
  it("does not automatically index a thin default page, but respects explicit intent", () => {
    const thin = { ...page, subtitle: "", description: LINKTREE_DEFAULT_DESCRIPTION };
    expect(isPageIndexable(thin)).toBe(false);
    expect(isPageIndexable({ ...thin, template_config: { seo: { robotsIndex: true } } })).toBe(true);
    expect(isPageIndexable({ ...page, template_config: { seo: { robotsIndex: "false" } } })).toBe(true);
  });
  it("escapes script terminators and rejects unsafe metadata URLs", () => {
    const text = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(text).not.toContain("</script>");
    expect(JSON.parse(text)).toEqual({ name: "</script><script>alert(1)</script>" });
    expect(publicAssetUrl("javascript:alert(1)", "https://sponsor.krd")).toBeUndefined();
    expect(publicAssetUrl("//evil.test/logo.png", "https://sponsor.krd")).toBeUndefined();
  });
  it("produces host-bound, escaped sitemap chunks and indexes", () => {
    const xml = sitemapXml("https://a.sponsor.krd", [{ slug: "business", updatedAt: "2026-10-02" }], false);
    expect(xml).toContain("https://a.sponsor.krd/linktree/business");
    expect(xml).not.toContain("https://b.sponsor.krd");
    expect(xml).toContain("2026-10-02T00:00:00.000Z");
    expect(sitemapIndexXml("https://a.sponsor.krd", 2)).toContain("/sitemaps/1.xml");
    expect(sitemapXml("https://sponsor.krd", [], true)).toContain("https://sponsor.krd/legal/privacy");
    expect(xml).not.toContain("/legal/");
    expect(() => sitemapIndexXml("https://sponsor.krd", 50_001)).toThrow(RangeError);
    expect(() => sitemapIndexXml("https://sponsor.krd", Infinity)).toThrow(RangeError);
  });
});
