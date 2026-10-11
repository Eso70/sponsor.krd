import { describe, expect, it } from "vitest";
import { canSubmitQuestions } from "./form-preview-answers";
import { visibleFormQuestions } from "./form-card-pages";
import { createForm, createQuestion } from "./forms-model";

describe("submission readiness for dependent answers", () => {
  it("ignores hidden required questions and enables them when their condition matches", () => {
    const form = {
      ...createForm("en"),
      questions: [
        {
          ...createQuestion("choice"),
          id: "source",
          options: ["Yes", "No"],
          required: true,
        },
        {
          ...createQuestion(),
          id: "details",
          required: true,
          condition: { questionId: "source", equals: "Yes" },
        },
      ],
    };
    const ready = (answers: Record<string, string>) =>
      canSubmitQuestions(visibleFormQuestions(form, answers), answers, {});
    expect(ready({ source: "No" })).toBe(true);
    expect(ready({ source: "Yes" })).toBe(false);
    expect(ready({ source: "Yes", details: "Provided" })).toBe(true);
  });
  it("requires the full conditional dropdown path and rejects obsolete selections", () => {
    const question = {
      ...createQuestion("conditional"),
      id: "location",
      required: true,
      conditional: {
        columns: ["City", "Branch"],
        rows: [
          ["Erbil", "One"],
          ["Duhok", "Two"],
        ],
      },
    };
    const ready = (path: string[]) =>
      canSubmitQuestions([question], { location: JSON.stringify(path) }, {});
    expect(ready(["Erbil", ""])).toBe(false);
    expect(ready(["Erbil", "Two"])).toBe(false);
    expect(ready(["Erbil", "One"])).toBe(true);
  });
});
