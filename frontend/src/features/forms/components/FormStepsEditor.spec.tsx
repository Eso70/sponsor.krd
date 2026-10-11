import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { FormComponentEditor } from "./FormComponentEditor";
import { FormBlockPreview } from "./FormBlockPreview";
import { formsCopy } from "../forms-copy";
import { formEditorCopy } from "../form-editor-copy";
import { formListItems } from "../form-list-items";
import { createForm, duplicateForm, validateForm } from "../forms-model";
import type { FormContentBlock, FormLanguage } from "../types";
function Editor({ language }: { language: FormLanguage }) {
  const [block, setBlock] = useState<FormContentBlock>({
    id: "steps",
    type: "steps",
    title: "",
    text: "",
    items: [],
  });
  const copy = formsCopy(language);
  const labels = formEditorCopy(language);
  return (
    <>
      <FormComponentEditor
        block={block}
        copy={copy}
        labels={labels}
        language={language}
        onChange={(patch) => setBlock((current) => ({ ...current, ...patch }))}
      />
      <div data-testid="preview">
        <FormBlockPreview
          block={block}
          copy={copy}
          labels={labels}
          placeholders
        />
      </div>
    </>
  );
}
describe("Steps component", () => {
  it.each(["en", "ar", "ckb"] as const)(
    "edits, reorders and limits steps in %s",
    (language) => {
      render(<Editor language={language} />);
      const labels = formEditorCopy(language);
      const copy = formsCopy(language);
      expect(
        screen.getByRole("textbox", { name: copy.headline }),
      ).toHaveAttribute("maxlength", "30");
      expect(
        screen.queryByRole("textbox", { name: copy.sectionText }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: `${labels.stepTitle} 1` }),
      ).toHaveAttribute("maxlength", "70");
      fireEvent.change(
        screen.getByRole("textbox", { name: `${labels.stepTitle} 1` }),
        { target: { value: "First step" } },
      );
      fireEvent.change(
        screen.getByRole("textbox", { name: `${labels.stepDescription} 1` }),
        { target: { value: "First details" } },
      );
      fireEvent.change(
        screen.getByRole("textbox", { name: `${labels.stepTitle} 2` }),
        { target: { value: "Second step" } },
      );
      const preview = screen.getByTestId("preview");
      expect(within(preview).getAllByRole("listitem")).toHaveLength(3);
      fireEvent.keyDown(
        screen.getByRole("button", {
          name: `${labels.reorder}: ${labels.step} 1`,
        }),
        { key: "ArrowDown" },
      );
      expect(
        screen.getByRole("textbox", { name: `${labels.stepTitle} 1` }),
      ).toHaveValue("Second step");
      expect(
        screen.getByRole("textbox", { name: `${labels.stepDescription} 2` }),
      ).toHaveValue("First details");
      expect(within(preview).getAllByRole("listitem")[0]).toHaveTextContent(
        "Second step",
      );
      const add = screen.getByRole("button", { name: labels.addStep });
      fireEvent.click(add);
      fireEvent.click(add);
      expect(add).toBeDisabled();
      expect(within(preview).getAllByRole("listitem")).toHaveLength(5);
      for (const number of [5, 4, 3, 1])
        fireEvent.click(
          screen.getByRole("button", {
            name: `${copy.remove} ${labels.step} ${number}`,
          }),
        );
      expect(within(preview).getAllByRole("listitem")).toHaveLength(1);
      expect(within(preview).getAllByRole("listitem")[0]).toHaveTextContent(
        "First step",
      );
      expect(
        screen.getByRole("button", { name: `${copy.remove} ${labels.step} 1` }),
      ).toBeDisabled();
      expect(add).toBeEnabled();
    },
  );
  it("keeps default identifiers stable and duplicates authored steps independently", () => {
    const block: FormContentBlock = {
      id: "steps",
      type: "steps",
      title: "",
      text: "",
      items: [],
    };
    expect(formListItems(block)).toEqual(formListItems(block));
    expect(formListItems(block)).toHaveLength(3);
    const form = {
      ...createForm("en"),
      name: "Steps",
      blocks: [{ ...block, items: formListItems(block) }],
    };
    const clone = duplicateForm(form);
    expect(clone.blocks[0].items?.[0].id).not.toBe(form.blocks[0].items[0].id);
    expect(
      validateForm({
        ...form,
        blocks: [
          {
            ...block,
            items: Array.from({ length: 6 }, (_, index) => ({
              id: String(index),
              title: "",
              text: "",
            })),
          },
        ],
      }),
    ).toBe("questions");
  });
});
