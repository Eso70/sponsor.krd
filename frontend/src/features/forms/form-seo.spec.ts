import { describe, it, expect } from "vitest";
import { buildFormMetadata } from "./form-seo";
import { createForm } from "./forms-model";
import { NON_DESCRIPTIVE_PAGE_TEXT } from "@linktree/types";
import {
  NON_DESCRIPTIVE_PAGE_TEXT as serverPrompts,
  isIndexableLinktree,
  indexableFormSql,
} from "../../../../backend/src/common/page-seo";
import { sitemapXml } from "@/lib/public/sitemap";
const form = {
  ...createForm("en"),
  status: "active" as const,
  slug: "book-consultation",
  name: "Book a consultation",
  headline: "Book a consultation",
  description: "Schedule a consultation with our team in Erbil.",
  banner: "/images/upload/banner.png",
};
describe("public form discovery", () => {
  it("starts new forms with Kurdish, dark appearance and red accent", () => {
    expect(createForm()).toMatchObject({
      language: "ckb",
      appearance: "dark",
      color: "#ef4444",
    });
  });
  it("uses identical content eligibility on the server and client", () => {
    expect(serverPrompts).toEqual(NON_DESCRIPTIVE_PAGE_TEXT);
    for (const description of [
      "",
      ...NON_DESCRIPTIVE_PAGE_TEXT,
      form.description,
    ]) {
      const metadata = buildFormMetadata(
        { ...form, description },
        "https://a.sponsor.krd",
      );
      expect(metadata.robots).toMatchObject({
        index: isIndexableLinktree({ name: form.headline, description }),
      });
    }
    expect(
      buildFormMetadata({ ...form, status: "paused" }, "https://a.sponsor.krd")
        .robots,
    ).toMatchObject({ index: false });
    expect(indexableFormSql()).toContain("f.definition->>'description'");
    expect(indexableFormSql()).toContain("f.definition->>'headline'");
  });
  it("isolates canonicals, sharing images and locale by validated origin", () => {
    const metadata = buildFormMetadata(
      { ...form, language: "ar" },
      "https://a.sponsor.krd",
    );
    expect(metadata.alternates?.canonical).toBe(
      "https://a.sponsor.krd/form/book-consultation",
    );
    expect(metadata.openGraph).toMatchObject({
      url: "https://a.sponsor.krd/form/book-consultation",
      locale: "ar_IQ",
      images: [{ url: "https://a.sponsor.krd/images/upload/banner.png" }],
    });
    expect(
      buildFormMetadata(form, "https://b.sponsor.krd").alternates?.canonical,
    ).toBe("https://b.sponsor.krd/form/book-consultation");
    expect(
      buildFormMetadata(
        { ...form, banner: "data:image/png;base64,AAAA", logo: "" },
        "https://a.sponsor.krd",
      ).twitter,
    ).toMatchObject({ card: "summary" });
  });
  it("uses the public headline and uploaded logo with a business-logo fallback", () => {
    const own = buildFormMetadata(
      { ...form, name: "Form name", logo: "/images/upload/logo.png" },
      "https://a.sponsor.krd",
      "/images/upload/business.png",
    );
    expect(own.title).toEqual({ absolute: form.headline });
    expect(own.icons).toMatchObject({
      icon: "https://a.sponsor.krd/images/upload/logo.png",
    });
    expect(
      buildFormMetadata(
        { ...form, logo: "" },
        "https://a.sponsor.krd",
        "/images/upload/business.png",
      ).icons,
    ).toMatchObject({
      icon: "https://a.sponsor.krd/images/upload/business.png",
    });
  });
  it("never substitutes the internal name for an empty public headline", () => {
    const metadata = buildFormMetadata(
      { ...form, name: "Internal campaign name", headline: "" },
      "https://a.sponsor.krd",
    );
    expect(metadata.robots).toMatchObject({ index: false });
    expect(JSON.stringify({ title: metadata.title, openGraph: metadata.openGraph, twitter: metadata.twitter }))
      .not.toContain("Internal campaign name");
  });
  it("keeps mixed sitemap routes distinct even with identical slugs", () => {
    const xml = sitemapXml(
      "https://a.sponsor.krd",
      [
        { slug: "same", pageType: "form", updatedAt: "2026-10-11" },
        { slug: "same", updatedAt: "2026-10-11" },
      ],
      false,
    );
    expect(xml).toContain("/form/same</loc>");
    expect(xml).toContain("/linktree/same</loc>");
  });
});
