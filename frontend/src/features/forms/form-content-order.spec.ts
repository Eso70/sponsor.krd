import { describe, expect, it } from "vitest";
import { createForm, duplicateForm } from "./forms-model";
import { formContentOrder, reorderFormContent } from "./form-content-order";

describe("mixed form content order", () => {
  const form = {
    ...createForm("en"),
    blocks: [
      { id: "a", title: "A", text: "Authored text" },
      { id: "b", title: "B", text: "More text" },
    ],
  };
  it("normalizes old drafts and removes stale and duplicate identifiers", () => {
    expect(formContentOrder(form)).toEqual(["questions", "a", "b"]);
    expect(
      formContentOrder({ ...form, contentOrder: ["b", "gone", "b"] }),
    ).toEqual(["b", "questions", "a"]);
  });
  it("moves Questions among components without changing their content", () => {
    const patch = reorderFormContent(form, "questions", "a")!;
    expect(patch.contentOrder).toEqual(["a", "questions", "b"]);
    expect(patch.blocks?.[0]).toBe(form.blocks[0]);
    expect(reorderFormContent(form, "a", "questions")?.contentOrder).toEqual([
      "a",
      "questions",
      "b",
    ]);
    expect(reorderFormContent(form, "missing", "a")).toBeNull();
  });
  it("remaps the order when duplicating a draft", () => {
    const copy = duplicateForm({
      ...form,
      contentOrder: ["b", "questions", "a"],
    });
    expect(copy.contentOrder).toEqual([
      copy.blocks[1].id,
      "questions",
      copy.blocks[0].id,
    ]);
    expect(copy.blocks[0].text).toBe("Authored text");
  });
});
