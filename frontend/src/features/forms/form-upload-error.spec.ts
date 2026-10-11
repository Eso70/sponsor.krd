import { describe, expect, it } from "vitest";
import { formUploadIssues } from "./form-upload-error";
import { createForm, createQuestion } from "./forms-model";
import { formsCopy } from "./forms-copy";
import { formImageBlob } from "./form-media";

describe("local form uploads", () => {
  for (const format of ["png", "jpeg", "webp"])
    it(`preserves ${format} bytes and MIME type without a network read`, async () => {
      const blob = formImageBlob(`data:image/${format};base64,aGVsbG8=`);
      expect(blob.type).toBe(`image/${format}`);
      expect(await blob.text()).toBe("hello");
    });
  it("rejects remote URLs, SVG and invalid data before an upload request", () => {
    for (const value of [
      "https://example.com/image.png",
      "/images/upload/test.png",
      "data:image/svg+xml;base64,aGVsbG8=",
      "data:image/png;base64,!",
    ])
      expect(() => formImageBlob(value)).toThrow();
  });
  it("names every shared image placement including later choices and component images", () => {
    const image = "data:image/png;base64,aGVsbG8=",
      other = "data:image/png;base64,dGVzdA==";
    const question = {
      ...createQuestion("choice"),
      label: "Choose a city",
      options: ["Erbil", "Sulaymaniyah"],
      optionImages: [other, image],
    };
    const form = {
      ...createForm("en"),
      logo: image,
      bannerImages: [other, image],
      questions: [question],
      blocks: [
        {
          id: "products",
          type: "products" as const,
          title: "Our products",
          text: "",
          products: [
            { id: "one", image: other, title: "First", description: "" },
            { id: "two", image, title: "Second", description: "" },
          ],
        },
      ],
    };
    const issues = formUploadIssues(form, image, formsCopy("en"));
    expect(issues.map((issue) => issue.field)).toEqual([
      "logo",
      "bannerImages.1",
      `questions.${question.id}.optionImages.1`,
      "blocks.products.products.1.image",
    ]);
    expect(issues[2]).toMatchObject({
      questionId: question.id,
      message: "Q1 � Choose a city � Options 2 � Sulaymaniyah",
    });
    expect(issues[3]).toMatchObject({
      blockId: "products",
      section: "component",
    });
    expect(
      formUploadIssues(
        { ...form, logo: other, bannerImages: [], questions: [], blocks: [] },
        image,
        formsCopy("en"),
      ),
    ).toEqual([]);
  });
});
