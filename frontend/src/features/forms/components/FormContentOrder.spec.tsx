import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createForm } from "../forms-model";
import { formsCopy } from "../forms-copy";
import { formEditorCopy } from "../form-editor-copy";
import { FormContentEditor } from "./FormContentEditor";
import { FormPreview } from "./FormPreview";

function Editor() {
  const [form, setForm] = useState({
    ...createForm("en"),
    blocks: [{ id: "a", title: "Details", text: "Our details" }],
  });
  return (
    <>
      <FormContentEditor
        form={form}
        copy={formsCopy("en")}
        labels={formEditorCopy("en")}
        onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
      />
      <FormPreview form={form} />
    </>
  );
}
afterEach(() => vi.restoreAllMocks());

describe("form section ordering", () => {
  it("keeps fixed sections outside drag groups and synchronizes preview with header reordering", () => {
    const { container } = render(<Editor />);
    expect(container.querySelectorAll("section[data-reorder-id]")).toHaveLength(
      2,
    );
    const preview = container.querySelector<HTMLElement>(
      "[data-form-preview]",
    )!;
    const input = screen.getByRole("textbox", { name: "Name" });
    fireEvent.change(input, { target: { value: "Kept answer" } });
    fireEvent.keyDown(
      screen.getByRole("button", {
        name: "Drag to reorder; use Up/Down keys: Questions (2)",
      }),
      { key: "ArrowDown" },
    );
    expect(
      Array.from(container.querySelectorAll("section[data-reorder-id]")).map(
        (el) => el.getAttribute("data-reorder-id"),
      ),
    ).toEqual(["a", "questions"]);
    expect(
      preview
        .querySelector("form")!
        .compareDocumentPosition(within(preview).getByText("Our details")) &
        Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
    expect(input).toHaveValue("Kept answer");
    const deleteButton = screen.getByRole("button", { name: "Delete Details" });
    expect(deleteButton).toHaveTextContent("");
    expect(deleteButton.querySelector("svg")).toBeInTheDocument();
    fireEvent.click(deleteButton);
    expect(within(preview).queryByText("Our details")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
      "Kept answer",
    );
    expect(container.querySelectorAll("section[data-reorder-id]")).toHaveLength(
      1,
    );
  });
  it("drags a component over a nested question to move the entire Questions section", () => {
    const { container } = render(<Editor />);
    const handle = screen.getByRole("button", {
      name: "Drag to reorder; use Up/Down keys: Details",
    });
    Object.assign(handle, {
      setPointerCapture: vi.fn(),
      hasPointerCapture: () => false,
    });
    const nested = container.querySelector("details[data-reorder-id]")!;
    const original = document.elementFromPoint;
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: () => nested,
    });
    try {
      fireEvent(
        handle,
        new MouseEvent("pointerdown", {
          bubbles: true,
          button: 0,
          clientX: 10,
          clientY: 10,
        }),
      );
      const held = handle.closest("section")!;
      expect(held).toHaveAttribute("data-reorder-held", "true");
      fireEvent(
        handle,
        new MouseEvent("pointermove", {
          bubbles: true,
          clientX: 20,
          clientY: 20,
        }),
      );
      expect(nested.closest("section")).toHaveAttribute(
        "data-reorder-target",
        "true",
      );
      fireEvent(handle, new MouseEvent("pointerup", { bubbles: true }));
      expect(held).not.toHaveAttribute("data-reorder-held");
      expect(nested.closest("section")).not.toHaveAttribute(
        "data-reorder-target",
      );
      expect(
        Array.from(container.querySelectorAll("section[data-reorder-id]")).map(
          (el) => el.getAttribute("data-reorder-id"),
        ),
      ).toEqual(["a", "questions"]);
      expect(document.documentElement).not.toHaveAttribute(
        "data-reorder-dragging",
      );
    } finally {
      Object.defineProperty(document, "elementFromPoint", {
        configurable: true,
        value: original,
      });
    }
  });
});
