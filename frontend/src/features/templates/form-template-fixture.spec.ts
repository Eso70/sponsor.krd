import { describe, expect, it } from "vitest";
import { createForm } from "@/features/forms/forms-model";
import { createFormTemplateFixture } from "./form-template-fixture";

describe("form catalogue fixture", () => {
  it.each(["en", "ar", "ckb"] as const)("demonstrates every supported field and section in %s", (language) => {
    const form = createFormTemplateFixture(language);
    expect(form.questions.map((question) => question.type).sort()).toEqual(["short", "email", "phone", "choice", "conditional", "date", "image", "product"].sort());
    expect(form.blocks.map((block) => block.type).sort()).toEqual(["text", "image", "carousel", "products", "testimonials", "steps", "about", "faq"].sort());
    expect(form.bannerImages).toHaveLength(2);
    expect(form.questions.find((question) => question.type === "conditional")?.conditional?.rows.length).toBeGreaterThan(1);
    expect(form.questions.find((question) => question.type === "product")?.productSelection?.items).toHaveLength(2);
    expect(form.headline).not.toBe("");
    expect(form.finalTitle).not.toBe("");
    expect(new Set([...form.questions, ...form.blocks].map((item) => item.id)).size).toBe(form.questions.length + form.blocks.length);
    expect(createForm(language).blocks).toHaveLength(0);
    expect(createForm(language).questions).toHaveLength(2);
    expect(createForm(language).headline).toBe("");
  });
});
