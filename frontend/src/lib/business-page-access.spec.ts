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
      "business:pages:advertising-access",
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
        ["business:forms:read", "business:pages:advertising-access"],
        plan,
      );
      expect(isBusinessPageVisible("forms", manifest)).toBe(plan === "max");
      expect(isBusinessPageVisible("advertising", manifest)).toBe(
        plan === "ultra" || plan === "max",
      );
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

  it.each(["basic", "pro"])(
    "locks the advertising page for the %s plan even if the permission says allow",
    (planCode) => {
      // The plan decides, not the permission row: a stale or hand-granted
      // permission must not put a paid-plan page in front of a lower plan.
      const manifest = access(["business:pages:advertising-access"], planCode);

      expect(
        manifest.permissions["business:pages:advertising-access"].outcome,
      ).toBe("allow");
      expect(isBusinessPageLocked("advertising", manifest)).toBe(true);
    },
  );

  it("unlocks advertising for Ultra when the page permission is allowed", () => {
    const ultra = access(["business:pages:advertising-access"], "ultra");
    expect(isBusinessPageLocked("advertising", ultra)).toBe(false);
  });

  it("locks advertising for Ultra when the page permission is withheld", () => {
    // Fails closed: anything short of an explicit allow stays locked.
    const ultra = access([], "ultra");
    expect(isBusinessPageLocked("advertising", ultra)).toBe(true);
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
