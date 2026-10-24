/** Move an item by stable ID while retaining each item's data and identity. */
export function reorderItems<T extends { id: string }>(items: T[], sourceId: string, targetId: string): T[] {
  const source = items.findIndex((item) => item.id === sourceId);
  const target = items.findIndex((item) => item.id === targetId);
  if (source < 0 || target < 0 || source === target) return items;
  const reordered = [...items];
  const [item] = reordered.splice(source, 1);
  reordered.splice(target, 0, item);
  return reordered;
}
