import { reorderSocialLinks } from "./link-order";
import { groupSocialLinksByPlatform, normalizeSelectedSocialLinks } from "./link-payload";
import type { SocialLink } from "./types";

describe("Linktree ordering", () => {
  const links: SocialLink[] = [
    { id: "first", platform: "custom", url: "https://first.example", enabled: true, order: 0 },
    { id: "middle", platform: "instagram", url: "https://instagram.com/business", enabled: true, order: 1 },
    { id: "last", platform: "custom", url: "https://last.example", enabled: true, order: 2 },
    { id: "gps", platform: "gps", url: "https://maps.google.com", enabled: true, order: 3 },
    { id: "hidden", platform: "youtube", url: "", enabled: false, order: 4 },
  ];
  const selected = ["first", "middle", "last", "gps"];
  it("moves directly to a target and preserves all row values and hidden drafts", () => {
    const result = reorderSocialLinks(links, selected, "last", "first");
    expect(result.filter((link) => selected.includes(link.id)).sort((a, b) => a.order! - b.order!).map((link) => link.id)).toEqual(["last", "first", "middle", "gps"]);
    expect(result[4]).toBe(links[4]);
    expect(links[2].order).toBe(2);
    expect(result[2].url).toBe(links[2].url);
  });
  it("keeps GPS pinned and ignores invalid destinations", () => {
    for (const [source, target] of [["gps", "first"], ["first", "gps"], ["first", "hidden"], ["first", "first"]]) {
      expect(reorderSocialLinks(links, selected, source, target)).toBe(links);
    }
  });
  it("retains global positions when multiple instances are grouped by platform", () => {
    const grouped = groupSocialLinksByPlatform(normalizeSelectedSocialLinks(links, selected));
    expect(grouped.metadata.custom.map((item) => item.display_order)).toEqual([0, 2]);
    expect(grouped.metadata.instagram[0].display_order).toBe(1);
  });
});
