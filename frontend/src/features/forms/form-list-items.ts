import type { FormContentBlock } from "./types";

export function formListItems(
  block: FormContentBlock,
): NonNullable<FormContentBlock["items"]> {
  return block.items?.length
    ? block.items
    : Array.from({ length: 3 }, (_, index) => ({
        id: `${block.id}-item-${index}`,
        title: "",
        text: "",
      }));
}
