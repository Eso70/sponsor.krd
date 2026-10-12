import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { FormQuestionsEditor } from "./FormQuestionsEditor";
import {
  createForm,
  createQuestion,
  reorderFormQuestions,
} from "../forms-model";
import { formsCopy } from "../forms-copy";
import { formEditorCopy } from "../form-editor-copy";
import { conditionalCopy } from "../conditional-copy";
import type { FormLanguage, FormDraft } from "../types";

function Editor({
  language = "en",
  layout = "form",
  mixed = false,
  draftLanguage = language,
}: {
  language?: FormLanguage;
  layout?: FormDraft["layout"];
  mixed?: boolean;
  draftLanguage?: FormLanguage;
}) {
  const [form, setForm] = useState({
    ...createForm(draftLanguage),
    layout,
    questions: [
      { ...createQuestion(), label: "First" },
      {
        ...createQuestion(),
        label: "Second",
        category: mixed ? "contact" : undefined,
      },
    ],
  });
  return (
    <FormQuestionsEditor
      form={form}
      copy={formsCopy(language)}
      labels={formEditorCopy(language)}
      onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
    />
  );
}
describe("question authoring controls", () => {
  it.each(["en", "ar", "ckb"] as const)(
    "keeps product editor labels in %s when the form's content language differs",
    (language) => {
      const copy = formsCopy(language);
      const productCopy = formEditorCopy(language).productSelection;
      render(
        <Editor
          language={language}
          draftLanguage={language === "ckb" ? "en" : "ckb"}
        />,
      );
      fireEvent.click(
        screen.getAllByRole("button", { name: `+ ${copy.addQuestion}` })[0],
      );
      fireEvent.click(screen.getByRole("option", { name: productCopy.title }));
      expect(
        screen.getByRole("textbox", { name: productCopy.name }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: productCopy.price }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: productCopy.price }),
      ).toHaveAttribute("placeholder", productCopy.priceHint);
    },
  );
  it.each(["form", "card"] as const)(
    "adds the product question from the shared question menu in %s",
    (layout) => {
      render(<Editor layout={layout} />);
      fireEvent.click(
        screen.getAllByRole("button", { name: "+ Add question" })[0],
      );
      fireEvent.click(
        screen.getByRole("option", { name: "Product selection" }),
      );
      expect(
        screen.getByRole("textbox", { name: "Product name" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: "Unit price" }),
      ).toBeInTheDocument();
    },
  );
  it.each(["form", "card"] as const)(
    "drags custom and personal questions together in %s layout",
    (layout) => {
      const { container } = render(<Editor layout={layout} mixed />);
      const rows = Array.from(
        container.querySelectorAll<HTMLElement>("details[data-reorder-id]"),
      );
      expect(rows[0].dataset.reorderGroup).toBe(rows[1].dataset.reorderGroup);
      const handle = within(rows[0]).getByRole("button", {
        name: "Drag to reorder; use Up/Down keys Q1",
      });
      Object.assign(handle, {
        setPointerCapture: vi.fn(),
        hasPointerCapture: () => false,
      });
      const original = document.elementFromPoint;
      Object.defineProperty(document, "elementFromPoint", {
        configurable: true,
        value: () => rows[1],
      });
      try {
        const pointer = (type: string, y: number) =>
          fireEvent(
            handle,
            new MouseEvent(type, {
              bubbles: true,
              button: 0,
              clientX: 10,
              clientY: y,
            }),
          );
        pointer("pointerdown", 10);
        expect(rows[0]).toHaveAttribute("data-reorder-held", "true");
        pointer("pointermove", 80);
        expect(rows[1]).toHaveAttribute("data-reorder-target", "true");
        pointer("pointerup", 80);
        expect(
          Array.from(
            container.querySelectorAll<HTMLElement>("details[data-reorder-id]"),
          ).map((row) => row.dataset.reorderId),
        ).toEqual([rows[1].dataset.reorderId, rows[0].dataset.reorderId]);
        expect(screen.getByText("Q1").closest("summary")).toHaveTextContent(
          "Second",
        );
        fireEvent.keyDown(
          screen.getByRole("button", {
            name: "Drag to reorder; use Up/Down keys Q1",
          }),
          { key: "ArrowDown" },
        );
        expect(screen.getByText("Q1").closest("summary")).toHaveTextContent(
          "First",
        );
      } finally {
        Object.defineProperty(document, "elementFromPoint", {
          configurable: true,
          value: original,
        });
      }
    },
  );
  it("has no placeholder option or selection, adds conditional questions and places requirements beside fields", () => {
    render(<Editor />);
    fireEvent.click(
      screen.getAllByRole("button", { name: "+ Add question" })[0],
    );
    expect(
      screen.queryByRole("option", { name: "Add question" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(4);
    screen
      .getAllByRole("option")
      .forEach((option) =>
        expect(option).toHaveAttribute("aria-selected", "false"),
      );
    fireEvent.click(screen.getByRole("option", { name: "Conditional answer" }));
    expect(
      screen.getByRole("link", { name: "Download sample CSV file" }),
    ).toBeInTheDocument();
    const row = screen.getByText("Q1").closest("details")!;
    fireEvent.click(within(row).getByText("First"));
    const requirement = within(row).getByRole("button", {
      name: "Required Q1",
    });
    const input = within(row).getByRole("textbox", { name: "Question label" });
    expect(input.parentElement).toContainElement(requirement);
    expect(input).toHaveClass("!pe-32");
    expect(input.closest("label")).toBeNull();
    expect(requirement).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(requirement);
    expect(requirement).toHaveAttribute("aria-pressed", "false");
    expect(requirement).toHaveTextContent("Optional");
    expect(
      screen.queryByRole("checkbox", { name: "Required" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Up Q|Down Q/ }),
    ).not.toBeInTheDocument();
  });
  it("reorders through the header handle with stable question identities", () => {
    render(<Editor />);
    fireEvent.keyDown(
      screen.getByRole("button", {
        name: "Drag to reorder; use Up/Down keys Q1",
      }),
      { key: "ArrowDown" },
    );
    expect(screen.getByText("Q1").closest("summary")).toHaveTextContent(
      "Second",
    );
    expect(screen.getByText("Q2").closest("summary")).toHaveTextContent(
      "First",
    );
  });
  it.each(["ckb", "ar", "en"] as const)(
    "localizes the simpler conditional editor in %s",
    (language) => {
      render(
        <FormQuestionsEditor
          form={{
            ...createForm(language),
            questions: [createQuestion("conditional")],
          }}
          copy={formsCopy(language)}
          labels={formEditorCopy(language)}
          onChange={vi.fn()}
        />,
      );
      const copy = conditionalCopy(language);
      expect(screen.getByText(copy.guide)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: copy.upload }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: `${formsCopy(language).required} Q1`,
        }),
      ).toBeInTheDocument();
    },
  );
  it("preserves dependencies by rejecting a move before its source", () => {
    const source = { ...createQuestion("choice"), options: ["Yes", "No"] };
    const dependent = {
      ...createQuestion(),
      condition: { questionId: source.id, equals: "Yes" },
    };
    const unrelated = { ...createQuestion(), category: "contact" };
    const questions = [source, dependent, unrelated];
    expect(reorderFormQuestions(questions, dependent.id, source.id)).toBe(
      questions,
    );
    const reordered = reorderFormQuestions(
      questions,
      unrelated.id,
      dependent.id,
    );
    expect(reordered.map((question) => question.id)).toEqual([
      source.id,
      unrelated.id,
      dependent.id,
    ]);
    expect(reordered[2].condition).toEqual(dependent.condition);
  });
});
