import type { LinktreeListItem } from "@linktree/types";

/** Pins lead; the default page and newest pages keep their usual relative order. */
export function sortLinktreesForDashboard<
  T extends Pick<
    LinktreeListItem,
    "id" | "uid" | "is_pinned" | "is_default" | "created_at"
  >,
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const pinned = Number(!!b.is_pinned) - Number(!!a.is_pinned);
    if (pinned) return pinned;
    const defaultPage =
      Number(b.is_default === true || b.uid === "id") -
      Number(a.is_default === true || a.uid === "id");
    if (defaultPage) return defaultPage;
    return (
      (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0) ||
      a.id.localeCompare(b.id)
    );
  });
}
