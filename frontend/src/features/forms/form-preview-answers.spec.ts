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

describe("country-specific phone readiness", () => {
  const question = { ...createQuestion("phone"), id: "phone", required: true };
  it.each(["7501234567", "07501234567"])("accepts Iraqi mobile %s", (value) => {
    expect(
      canSubmitQuestions([question], { phone: value }, { phone: "964" }),
    ).toBe(true);
  });
  it.each(["750123456", "75012345678", "075012345678"])(
    "blocks the wrong Iraqi mobile length %s",
    (value) => {
      expect(
        canSubmitQuestions([question], { phone: value }, { phone: "964" }),
      ).toBe(false);
    },
  );
  it("validates using the currently selected country", () => {
    expect(
      canSubmitQuestions([question], { phone: "0612345678" }, { phone: "39" }),
    ).toBe(true);
    expect(
      canSubmitQuestions([question], { phone: "0612345678" }, { phone: "964" }),
    ).toBe(false);
  });
});
