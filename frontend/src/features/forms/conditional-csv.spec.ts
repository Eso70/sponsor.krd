import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { conditionalOptions, parseConditionalCsv } from "./conditional-csv";
import {
  createForm,
  createQuestion,
  duplicateForm,
  validateForm,
} from "./forms-model";

describe("conditional answer CSV", () => {
  it("imports the supplied template and filters by the complete answer prefix", () => {
    const data = parseConditionalCsv(
      readFileSync("public/forms/conditional-answers-template.csv", "utf8"),
    );
    expect(data.columns).toHaveLength(3);
    expect(data.rows).toHaveLength(10);
    expect(conditionalOptions(data, 0, [])).toEqual(["New York", "California"]);
    expect(conditionalOptions(data, 1, ["California"])).toEqual([
      "Los Angeles",
      "San Diego",
      "San Francisco",
    ]);
    expect(conditionalOptions(data, 2, ["California", "San Diego"])).toEqual([
      "Dealer6",
      "Dealer7",
      "Dealer8",
    ]);
    expect(conditionalOptions(data, 2, ["California", ""])).toEqual([]);
  });
  it("supports BOM, quoted commas, quotes, newlines and duplicate paths", () => {
    const data = parseConditionalCsv(
      '\uFEFFA,B\r\n"One, two","A ""quote"""\r\n"One, two","A ""quote"""\r\nC,"Line\nTwo"',
    );
    expect(data.rows).toEqual([
      ["One, two", 'A "quote"'],
      ["C", "Line\nTwo"],
    ]);
  });
  it.each([
    "",
    "A\nx",
    "A,A\nx,y",
    "A,B\nx",
    "A,B\nx,",
    'A,B\n"x,y',
    'A,B\n"x"z,y',
    'A,B\nx"z,y',
    "A,B\n" + "x".repeat(201) + ",y",
    "A,B\n" + "x,y\n".repeat(1001),
    "A,B,C,D,E,F\n1,2,3,4,5,6",
    "A,B\n" + " ".repeat(262145),
  ])("rejects malformed or excessive input", (source) => {
    expect(() => parseConditionalCsv(source)).toThrow();
  });
  it("clones matrices independently and requires CSV before marking ready", () => {
    const form = {
      ...createForm("en"),
      name: "Linked",
      actionsEnabled: false,
      questions: [createQuestion("conditional")],
    };
    expect(validateForm(form)).toBeNull();
    expect(validateForm({ ...form, status: "active" })).toBe("questions");
    form.questions[0].conditional = parseConditionalCsv("A,B\nx,y");
    expect(validateForm({ ...form, status: "active" })).toBeNull();
    const clone = duplicateForm(form);
    clone.questions[0].conditional!.rows[0][0] = "Changed";
    expect(form.questions[0].conditional.rows[0][0]).toBe("x");
    expect(
      validateForm({
        ...form,
        questions: [
          {
            ...form.questions[0],
            conditional: { columns: ["A", "B"], rows: [["x"]] },
          },
        ],
      }),
    ).toBe("questions");
  });
});
