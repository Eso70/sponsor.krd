import type { FormDraft } from "./types";

/** Normalize old drafts and discard removed or duplicate section identifiers. */
export function formContentOrder(form: FormDraft): string[] {
  const available = new Set([
    "questions",
    ...form.blocks.map((block) => block.id),
  ]);
  const order: string[] = [];
  for (const id of [...(form.contentOrder ?? ["questions"]), ...available]) {
    if (available.has(id) && !order.includes(id)) order.push(id);
  }
  return order;
}

export function reorderFormContent(
  form: FormDraft,
  source: string,
  target: string,
): Partial<FormDraft> | null {
  const contentOrder = formContentOrder(form);
  const from = contentOrder.indexOf(source);
  const to = contentOrder.indexOf(target);
  if (from < 0 || to < 0 || from === to) return null;
  contentOrder.splice(from, 1);
  contentOrder.splice(to, 0, source);
  const blocks = contentOrder.flatMap((id) => {
    const block = form.blocks.find((entry) => entry.id === id);
    return block ? [block] : [];
  });
  return { contentOrder, blocks };
}
