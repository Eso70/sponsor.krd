import { describe, expect, it } from "vitest";
import { formEditorIssues } from "./form-editor-validation";
import { createForm, createQuestion } from "./forms-model";
import { formsCopy } from "./forms-copy";

const copy = formsCopy("en");
describe("form editor validation targets", () => {
  it("requires a form title independent of the optional headline", () => {
    expect(formEditorIssues(createForm("en"), copy)).toEqual([
      expect.objectContaining({ field: "name", section: "title" }),
    ]);
    expect(
      formEditorIssues(
        { ...createForm("en"), name: "Contact", headline: "" },
        copy,
      ),
    ).toEqual([]);
  });
  it("preserves incomplete custom questions and empty CTA URLs in drafts", () => {
    expect(
      formEditorIssues(
        {
          ...createForm("en"),
          name: "Draft",
          headline: "Draft",
          questions: [createQuestion("choice")],
        },
        copy,
      ),
    ).toEqual([]);
  });
  it("targets malformed URLs and missing action labels independently", () => {
    const form = {
      ...createForm("en"),
      name: "Links",
      headline: "Links",
      actions: [
        {
          id: "button",
          type: "website" as const,
          text: "",
          url: "javascript:alert(1)",
        },
      ],
    };
    expect(formEditorIssues(form, copy).map((issue) => issue.field)).toEqual([
      "actions.button.url",
      "actions.button.text",
    ]);
  });
  it("requires at least one question before making a save request", () => {
    expect(
      formEditorIssues(
        {
          ...createForm("en"),
          name: "Empty",
          headline: "Empty",
          questions: [],
        },
        copy,
      ),
    ).toContainEqual(
      expect.objectContaining({ field: "questions", section: "questions" }),
    );
  });
  it("targets malformed media to its actual editor section", () => {
    const form = {
      ...createForm("en"),
      name: "Images",
      headline: "Images",
      logo: "https://external.example/image.png",
      banner: "javascript:bad",
    };
    expect(formEditorIssues(form, copy)).toEqual([
      expect.objectContaining({
        field: "banner",
        section: "banner",
        message: copy.imageError,
      }),
      expect.objectContaining({
        field: "logo",
        section: "introduction",
        message: copy.imageError,
      }),
    ]);
  });
  it("allows a published app button with only a Google Play URL", () => {
    const form = {
      ...createForm("en"),
      name: "App",
      headline: "App",
      status: "active" as const,
      actions: [
        {
          id: "app",
          type: "app" as const,
          text: "Download",
          url: "",
          googlePlayUrl: "https://play.google.com/store/apps",
        },
      ],
    };
    expect(formEditorIssues(form, copy)).toEqual([]);
  });
});
