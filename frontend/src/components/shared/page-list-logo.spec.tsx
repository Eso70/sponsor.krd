import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_AVATAR } from "@/lib/brand/brand-assets";
import { pageListLogo } from "./page-list-logo";
import { PageListCardHeader } from "./PageListCardHeader";

describe("collection owner logos", () => {
  it("uses the business avatar for missing and legacy system logos", () => {
    expect(pageListLogo(null, "/images/upload/business-avatar.png")).toBe("/images/upload/business-avatar.png");
    expect(pageListLogo(DEFAULT_AVATAR, "/images/upload/business-avatar.png")).toBe("/images/upload/business-avatar.png");
    expect(pageListLogo("/images/upload/page-logo.png", "/images/upload/business-avatar.png")).toBe("/images/upload/page-logo.png");
  });
  it("does not synthesize a system image when no owner media exists", () => {
    expect(pageListLogo("   ")).toBeNull();
    expect(pageListLogo(DEFAULT_AVATAR, DEFAULT_AVATAR)).toBeNull();
    const { container } = render(<PageListCardHeader name="Form without logo" logo={pageListLogo("")} />);
    expect(container.querySelector("img")).toBeNull();
  });
});
