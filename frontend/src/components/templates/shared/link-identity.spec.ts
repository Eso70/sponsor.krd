import { describe, expect, it } from "vitest";
import type { LinktreePresentationLink } from "@linktree/types";
import { getLinkIdentity } from "./link-identity";

function link(
  platform: string,
  url: string,
  originalInput?: string,
  countryCode?: string,
): LinktreePresentationLink {
  return {
    id: `${platform}-link`,
    platform,
    url,
    metadata: {
      original_input: originalInput ?? null,
      country_code: countryCode ?? null,
    },
  };
}

describe("getLinkIdentity", () => {
  it("adds a leading zero and omits the selected country code", () => {
    expect(
      getLinkIdentity(
        link("whatsapp", "https://wa.me/9647502485829", "7502485829", "964"),
      ),
    ).toBe("07502485829");
  });

  it("preserves one existing leading zero", () => {
    expect(
      getLinkIdentity(
        link("phone", "tel:+9647502485829", "07502485829", "964"),
      ),
    ).toBe("07502485829");
  });

  it("converts an older international destination to a local number", () => {
    expect(
      getLinkIdentity(link("viber", "viber://chat?number=+9647502485829")),
    ).toBe("07502485829");
  });

  it("shows a username entered directly", () => {
    expect(
      getLinkIdentity(
        link("instagram", "https://instagram.com/sponsor.krd", "sponsor.krd"),
      ),
    ).toBe("@sponsor.krd");
  });

  it("extracts a username from older links without metadata", () => {
    expect(
      getLinkIdentity(link("tiktok", "https://www.tiktok.com/@sponsor.krd")),
    ).toBe("@sponsor.krd");
  });

  it("does not display a private Telegram invite hash as an @username", () => {
    expect(getLinkIdentity(link("telegram", "https://t.me/+4cr7ocQoV-liNmU6"))).toBeNull();
    expect(getLinkIdentity(link("telegram", "https://t.me/+4cr7ocQoV-liNmU6", "+4cr7ocQoV-liNmU6"))).toBeNull();
  });

  it("does not mistake a post URL for an account username", () => {
    expect(
      getLinkIdentity(
        link(
          "instagram",
          "https://instagram.com/p/post-id",
          "https://instagram.com/p/post-id",
        ),
      ),
    ).toBeNull();
  });

  it("shows an email address without its mailto prefix", () => {
    expect(getLinkIdentity(link("email", "mailto:hello@example.com"))).toBe(
      "hello@example.com",
    );
  });
});
