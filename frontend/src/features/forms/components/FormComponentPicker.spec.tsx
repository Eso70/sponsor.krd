import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormComponentsEditor } from "./FormComponentsEditor";
import { createForm } from "../forms-model";
import { formEditorCopy } from "../form-editor-copy";
import { formsCopy } from "../forms-copy";

const types = [
  "text",
  "image",
  "carousel",
  "products",
  "testimonials",
  "steps",
  "about",
  "faq",
] as const;
afterEach(() => vi.restoreAllMocks());

describe("Form component picker", () => {
  it.each(["en", "ar", "ckb"] as const)(
    "adds all eight components from localized icon cards in %s",
    (language) => {
      const labels = formEditorCopy(language);
      const onChange = vi.fn();
      const { container } = render(
        <FormComponentsEditor
          form={createForm(language)}
          onChange={onChange}
          copy={formsCopy(language)}
          labels={labels}
        />,
      );
      for (const type of types) {
        fireEvent.click(
          screen.getByRole("button", { name: `+ ${labels.addComponent}` }),
        );
        const menu = screen.getByRole("listbox", { name: labels.addComponent });
        expect(container).not.toContainElement(menu);
        expect(within(menu).getAllByRole("option")).toHaveLength(8);
        expect(
          within(menu)
            .getAllByRole("option")
            .every(
              (option) => option.getAttribute("aria-selected") === "false",
            ),
        ).toBe(true);
        const card = within(menu).getByRole("option", { name: labels[type] });
        expect(card.querySelector("svg")).toBeInTheDocument();
        fireEvent.click(card);
        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            blocks: [
              expect.objectContaining({
                type,
                title: "",
                text: "",
                images: [],
                items: [],
              }),
            ],
          }),
        );
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      }
    },
  );

  it("opens above near the footer and supports Escape, outside dismissal and keyboard focus", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 650,
      bottom: 690,
      left: 600,
      right: 760,
      width: 160,
      height: 40,
      x: 600,
      y: 650,
      toJSON: () => ({}),
    });
    const labels = formEditorCopy("en");
    render(
      <FormComponentsEditor
        form={createForm("en")}
        onChange={vi.fn()}
        copy={formsCopy("en")}
        labels={labels}
      />,
    );
    const trigger = screen.getByRole("button", { name: "+ Add component" });
    trigger.focus();
    fireEvent.click(trigger);
    const menu = screen.getByRole("listbox");
    expect(menu.style.bottom).not.toBe("");
    expect(menu).toHaveFocus();
    fireEvent.keyDown(menu, { key: "Tab" });
    expect(screen.getByRole("option", { name: "Text" })).toHaveFocus();
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    fireEvent.click(trigger);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("keeps the existing twenty-component limit", () => {
    const form = createForm("en");
    form.blocks = Array.from({ length: 20 }, (_, index) => ({
      id: String(index),
      type: "text",
      title: "",
      text: "",
    }));
    render(
      <FormComponentsEditor
        form={form}
        onChange={vi.fn()}
        copy={formsCopy("en")}
        labels={formEditorCopy("en")}
      />,
    );
    expect(
      screen.getByRole("button", { name: "+ Add component" }),
    ).toBeDisabled();
  });
});
