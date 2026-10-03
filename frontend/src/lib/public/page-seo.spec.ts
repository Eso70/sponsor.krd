import { describe, it, expect } from "vitest";
import type { PublicLinktree } from "@linktree/types";
import { LINKTREE_DEFAULT_DESCRIPTION } from "@linktree/types";
import { NON_DESCRIPTIVE_PAGE_TEXT } from "@linktree/types";
import { NON_DESCRIPTIVE_PAGE_TEXT as backendStarterText, isIndexableLinktree } from "../../../../backend/src/common/page-seo";
import { automaticPageSeo, buildPageJsonLd, buildPageMetadata, canonicalPageUrl, isPageIndexable, serializeJsonLd, publicAssetUrl } from "./page-seo";
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
    expect(metadata.title).toEqual({ absolute: "Real business" });
    expect(metadata.description).toBe("Services provided by this business — Actual description");
    expect(metadata.alternates?.canonical).toBe("https://a.sponsor.krd/linktree/business");
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });
  it("automatically excludes starter pages and ignores retired overrides", () => {
    const thin = { ...page, subtitle: "", description: LINKTREE_DEFAULT_DESCRIPTION };
    expect(isPageIndexable(thin)).toBe(false);
    expect(isPageIndexable({ ...thin, template_config: { seo: { robotsIndex: true } } })).toBe(false);
    expect(isPageIndexable({ ...page, template_config: { seo: { robotsIndex: "false" } } })).toBe(true);
  });
  it("escapes script terminators and rejects unsafe metadata URLs", () => {
    const text = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(text).not.toContain("</script>");
    expect(JSON.parse(text)).toEqual({ name: "</script><script>alert(1)</script>" });
    expect(publicAssetUrl("javascript:alert(1)", "https://sponsor.krd")).toBeUndefined();
    expect(publicAssetUrl("//evil.test/logo.png", "https://sponsor.krd")).toBeUndefined();
  });
  it.each([
    ["Real services and contact information", "en"],
    ["خدمات الشركة ومعلومات التواصل", "ar"],
    ["خزمەتگوزاری و زانیارییەکانی پەیوەندی", "ckb"],
    ["123", "ckb"],
  ] as const)("infers %s consistently for metadata and structured data", (description, locale) => {
    const content = { ...page, subtitle: "", description };
    expect(automaticPageSeo(content).locale).toBe(locale);
    expect(buildPageJsonLd(content, "https://a.sponsor.krd").inLanguage).toBe(locale);
    expect(buildPageMetadata(content, "https://a.sponsor.krd").openGraph).toMatchObject({ locale: { en: "en_US", ar: "ar_IQ", ckb: "ckb_IQ" }[locale] });
  });
  it("uses page name when content is empty and ignores generic prompts for language", () => {
    expect(automaticPageSeo({ ...page, subtitle: "", description: LINKTREE_DEFAULT_DESCRIPTION })).toMatchObject({ title: "Real business", description: "Real business", imageSubtitle: "", locale: "en" });
  });
  it("cleans whitespace, removes duplicate descriptions and bounds long text", () => {
    expect(automaticPageSeo({ ...page, subtitle: " Real\nservices ", description: "Real services" }).description).toBe("Real services");
    const seo = automaticPageSeo({ ...page, name: "😀".repeat(160), subtitle: "", description: "Actual services ".repeat(100) });
    expect(Array.from(seo.title)).toHaveLength(150);
    expect(seo.description.length).toBeLessThanOrEqual(200);
    expect(seo.description).toMatch(/…$/);
    expect(seo.imageSubtitle.length).toBeLessThanOrEqual(100);
  });
  it("keeps backend and frontend indexing aligned for generic and mixed content", () => {
    for (const description of [...NON_DESCRIPTIVE_PAGE_TEXT, "", "Real services"]) {
      for (const subtitle of ["", "Real subtitle", " TO CONTACT US,\nTAP ONE OF THE LINKS BELOW "]) {
        const content = { ...page, description, subtitle, template_config: { seo: { robotsIndex: true } } };
        expect(isPageIndexable(content)).toBe(isIndexableLinktree(content));
      }
    }
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
