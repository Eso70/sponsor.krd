import { describe, expect, it } from "vitest";
import { getPermissionCategory, getPermissionDescription } from "./permission-descriptions";

const advertisingPermissions = [
  "business:pages:advertising-access",
  "business:advertising:read",
  "business:advertising:update",
  "business:advertising:publish",
];

describe("permission catalogue language", () => {
  it.each(["ckb", "ar", "en"] as const)("describes active advertising permissions in %s", (locale) => {
    for (const key of advertisingPermissions) {
      expect(getPermissionDescription(key, locale)).not.toMatch(/description|وصف|ڕوونکردنەوەی کوردی بۆ ئەم مۆڵەتە/);
    }
  });

  it("localizes known categories and preserves unknown custom values", () => {
    expect(getPermissionCategory("Advertising", "ckb")).toBe("ڕیکلام");
    expect(getPermissionCategory("Advertising", "ar")).toBe("الإعلانات");
    expect(getPermissionCategory("Advertising", "en")).toBe("Advertising");
    expect(getPermissionCategory("Custom category", "ar")).toBe("Custom category");
  });
});
