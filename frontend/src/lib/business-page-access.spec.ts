import { describe, expect, it } from "vitest";
import {
  isBusinessPageLocked,
  isBusinessPageVisible,
  isBusinessSettingsTabLocked,
} from "./business-page-access";

const access = (allowed: string[], planCode = "ultra") => ({
  subscription: { planCode },
  permissions: Object.fromEntries(
    [
      "business:forms:read",
      "business:tiktok:update",
      "business:pages:settings-access",
      "business:settings:profile-access",
      "business:settings:defaults-access",
      "business:settings:security-access",
    ].map((key) => [
      key,
      {
        outcome: allowed.includes(key) ? ("allow" as const) : ("deny" as const),
      },
    ]),
  ),
});

describe("business page access presentation", () => {
  it.each(["basic", "pro", "ultra", "max"])(
    "hides unavailable paid pages for %s even with explicit grants",
    (plan) => {
      const manifest = access(
        ["business:forms:read"],
        plan,
      );
      expect(isBusinessPageVisible("forms", manifest)).toBe(plan === "max");

    },
  );

  it("hides denied features and waits for loaded access", () => {
    expect(isBusinessPageVisible("forms", access([], "max"))).toBe(false);
    expect(isBusinessPageVisible("tiktok-config", access([]))).toBe(false);
    expect(isBusinessPageVisible("forms", null)).toBe(false);
    expect(isBusinessPageVisible("settings", access([], "basic"))).toBe(true);
  });
  it("keeps settings available on every business plan", () => {
    expect(isBusinessPageLocked("settings", access([], "basic"))).toBe(false);
  });

  it("keeps settings reachable without a page permission", () => {
    const basicOrPro = access([
      "business:pages:settings-access",
      "business:settings:defaults-access",
      "business:settings:security-access",
    ]);

    expect(isBusinessPageLocked("settings", basicOrPro)).toBe(false);
  });

  it("keeps TikTok Config reachable when TikTok configuration is available", () => {
    const basicOrPro = access(["business:tiktok:update"]);
    expect(isBusinessPageLocked("tiktok-config", basicOrPro)).toBe(false);
  });

  it("locks only the first Settings tab for Basic and Pro access", () => {
    const basicOrPro = access([
      "business:pages:settings-access",
      "business:settings:defaults-access",
      "business:settings:security-access",
    ]);

    expect(isBusinessSettingsTabLocked("profile", basicOrPro)).toBe(true);
    expect(isBusinessSettingsTabLocked("defaults", basicOrPro)).toBe(false);
    expect(isBusinessSettingsTabLocked("security", basicOrPro)).toBe(false);
    expect(isBusinessSettingsTabLocked("messages", basicOrPro)).toBe(false);
  });
});
