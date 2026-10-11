import { describe, expect, it } from "vitest";
import { formEditorCopy } from "./form-editor-copy";
import type { FormQuestion } from "./types";
import {
  createForm,
  createQuestion,
  duplicateForm,
  formDraftName,
  isFormUrl,
  formActionUrl,
  validateForm,
} from "./forms-model";

describe("frontend form rules", () => {
  it("requires an app destination when ready and validates both stores independently", () => {
    const app = {
      id: "app",
      type: "app" as const,
      text: "Download",
      url: "",
      appStoreUrl: "",
      googlePlayUrl: "",
    };
    const form = { ...createForm("en"), name: "Contact", actions: [app] };
    expect(validateForm(form)).toBeNull();
    expect(validateForm({ ...form, status: "active" })).toBe("url");
    app.googlePlayUrl = "https://play.google.com/store/apps/details?id=example";
    expect(validateForm({ ...form, status: "active" })).toBeNull();
    expect(formActionUrl(app)).toBe(app.googlePlayUrl);
    app.appStoreUrl = "javascript:alert(1)";
    expect(validateForm(form)).toBe("url");
    app.appStoreUrl = "https://apps.apple.com/app/example";
    expect(formActionUrl(app, "Android")).toBe(app.googlePlayUrl);
    expect(formActionUrl(app, "iPhone")).toBe(app.appStoreUrl);
  });
  it.each(["en", "ckb", "ar"] as const)(
    "starts new %s forms with optional name then required phone fields",
    (language) => {
      const form = createForm(language);
      expect(form.actions).toEqual([
        expect.objectContaining({
          type: "website",
          text: formEditorCopy(language).website,
          textKey: "website",
          url: "",
        }),
      ]);
      expect(
        form.questions.map((question) => ({
          type: question.type,
          key: question.labelKey,
          required: question.required,
        })),
      ).toEqual([
        { type: "short", key: "personName", required: false },
        { type: "phone", key: "phone", required: true },
      ]);
    },
  );
  it("validates and independently duplicates choice images", () => {
    const image = "data:image/png;base64,YQ==";
    const form = {
      ...createForm("en"),
      name: "Choices",
      questions: [
        {
          ...createQuestion("choice"),
          options: ["A", "B"],
          optionImages: [image, ""],
        },
      ],
    };
    expect(validateForm(form)).toBeNull();
    const copy = duplicateForm(form);
    copy.questions[0].optionImages![0] = "";
    expect(form.questions[0].optionImages![0]).toBe(image);
    expect(
      validateForm({
        ...form,
        questions: [
          {
            ...form.questions[0],
            optionImages: ["https://example.com/image.png"],
          },
        ],
      }),
    ).toBe("url");
    expect(
      validateForm({
        ...form,
        questions: [{ ...form.questions[0], optionImages: [image, "", image] }],
      }),
    ).toBe("questions");
  });
  it("derives names from the current introduction headline instead of stale saved names", () => {
    const form = {
      ...createForm("en"),
      name: "Old title",
      headline: "  New headline  ",
    };
    expect(formDraftName(form)).toBe("New headline");
    expect(formDraftName({ ...form, headline: " " })).toBe("Untitled form");
  });
  it("allows incomplete drafts but requires a name", () => {
    const form = createForm("ckb");
    expect(validateForm(form)).toBe("name");
    expect(validateForm({ ...form, name: "Contact" })).toBeNull();
  });
  it("uses automatic policies and requires valid questions before ready status", () => {
    const form = {
      ...createForm("en"),
      name: "Contact",
      status: "active" as const,
      actions: [],
      questions: [] as FormQuestion[],
    };
    expect(validateForm(form)).toBe("questions");
    form.questions = [
      { ...createQuestion("choice"), label: "Product", options: ["A", " a "] },
    ];
    expect(validateForm(form)).toBe("questions");
    form.questions[0].options = ["A", "B"];
    expect(validateForm(form)).toBeNull();
  });
  it.each([
    "javascript:alert(1)",
    "data:text/html,test",
    "//example.com",
    "https://user:password@example.com",
  ])("rejects unsafe URL %s", (url) => {
    expect(isFormUrl(url)).toBe(false);
    expect(
      validateForm({
        ...createForm("en"),
        name: "Contact",
        buttonText: "Visit",
        buttonUrl: url,
      }),
    ).toBe("url");
  });
  it("duplicates with independent identities and editable arrays", () => {
    const form = {
      ...createForm("ar"),
      name: "Contact",
      questions: [createQuestion("choice")],
      blocks: [{ id: "block", title: "Title", text: "Text" }],
    };
    const copy = duplicateForm(form);
    expect(copy.id).not.toBe(form.id);
    expect(copy.questions[0].id).not.toBe(form.questions[0].id);
    expect(copy.blocks[0].id).not.toBe(form.blocks[0].id);
    copy.questions[0].options[0] = "Changed";
    expect(form.questions[0].options[0]).toBe("");
    expect(copy.language).toBe("ar");
  });
  it("validates nested action URLs and forward or stale logic references", () => {
    const form = { ...createForm("en"), name: "Contact" };
    expect(
      validateForm({
        ...form,
        actions: [
          { id: "a", type: "app", text: "Install", url: "data:text/html,test" },
        ],
      }),
    ).toBe("url");
    const source = { ...createQuestion("choice"), options: ["Yes", "No"] };
    const dependent = {
      ...createQuestion(),
      condition: { questionId: source.id, equals: "Yes" },
    };
    expect(
      validateForm({
        ...form,

        questions: [source, dependent],
      }),
    ).toBeNull();
    expect(
      validateForm({
        ...form,

        questions: [dependent, source],
      }),
    ).toBe("questions");
    const duplicate = duplicateForm({
      ...form,

      questions: [source, dependent],
    });
    expect(duplicate.questions[1].condition?.questionId).toBe(
      duplicate.questions[0].id,
    );
    expect(validateForm(duplicate)).toBeNull();
  });
});
