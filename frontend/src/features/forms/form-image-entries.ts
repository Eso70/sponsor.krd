import type { FormContentBlock, FormImageEntry } from "./types";

/** Keep each image and its details together, including older local drafts. */
export function formImageEntries(block: FormContentBlock): FormImageEntry[] {
  const entries =
    block.type === "testimonials" ? block.testimonials : block.products;
  if (entries) return entries;
  return Array.from(
    {
      length: Math.min(
        block.type === "testimonials" ? 6 : 5,
        Math.max(2, block.images?.length ?? 0, block.items?.length ?? 0),
      ),
    },
    (_, index) => ({
      id: block.items?.[index]?.id ?? `${block.id}-product-${index}`,
      image: block.images?.[index] ?? "",
      title: block.items?.[index]?.title ?? "",
      description: block.items?.[index]?.text ?? "",
    }),
  );
}
