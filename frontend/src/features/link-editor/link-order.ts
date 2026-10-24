import type { SocialLink } from "./types";

/** GPS remains the separate final section; hidden platform drafts stay untouched. */
export function reorderSocialLinks(links: SocialLink[], selectedIds: string[], source: string, target: string): SocialLink[] {
  const selected = new Set(selectedIds);
  const visible = links.filter((link) => selected.has(link.id)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const movable = visible.filter((link) => link.platform !== "gps");
  const from = movable.findIndex((link) => link.id === source);
  const to = movable.findIndex((link) => link.id === target);
  if (from < 0 || to < 0 || from === to) return links;
  const [moved] = movable.splice(from, 1);
  movable.splice(to, 0, moved);
  const positions = new Map([...movable, ...visible.filter((link) => link.platform === "gps")].map((link, index) => [link.id, index]));
  return links.map((link) => positions.has(link.id) ? { ...link, order: positions.get(link.id) } : link);
}
