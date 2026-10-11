import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { formsCopy } from "../forms-copy";
import { formEditorCopy } from "../form-editor-copy";
import { createForm, duplicateForm } from "../forms-model";
import { formTextStyle } from "../form-text-style";
import type { FormContentBlock, FormLanguage } from "../types";
import { FormComponentEditor } from "./FormComponentEditor";
import { FormBlockPreview } from "./FormBlockPreview";
function Editor({ language }: { language: FormLanguage }) {
  const [block, setBlock] = useState<FormContentBlock>({
    id: "text",
    type: "text",
    title: "",
    text: "",
  });
  const copy = formsCopy(language);
  const labels = formEditorCopy(language);
  return (
    <>
      <FormComponentEditor
        block={block}
        language={language}
        copy={copy}
        labels={labels}
        onChange={(patch) => setBlock((current) => ({ ...current, ...patch }))}
      />
      <div data-testid="preview">
        <FormBlockPreview
          block={block}
          copy={copy}
          labels={labels}
          placeholders={false}
        />
      </div>
    </>
  );
}
describe("text component formatting", () => {
  it.each(["en", "ar", "ckb"] as const)(
    "formats text and spacing with localized controls in %s",
    (language) => {
      render(<Editor language={language} />);
      const copy = formsCopy(language);
      const labels = formEditorCopy(language);
      expect(
        screen.queryByRole("textbox", { name: copy.sectionTitle }),
      ).not.toBeInTheDocument();
      fireEvent.change(
        screen.getByRole("textbox", { name: copy.sectionText }),
        { target: { value: "Hello <script>text</script>" } },
      );
      for (const label of [
        labels.bold,
        labels.italic,
        labels.underline,
        labels.heading1,
        labels.alignCenter,
      ])
        fireEvent.click(screen.getByRole("button", { name: label }));
      fireEvent.change(screen.getByRole("slider", { name: labels.marginTop }), {
        target: { value: "24" },
      });
      fireEvent.change(
        screen.getByRole("slider", { name: labels.marginBottom }),
        { target: { value: "32" } },
      );
      const preview = screen.getByTestId("preview").querySelector("section")!;
      expect(preview).toHaveStyle({
        fontWeight: "700",
        fontStyle: "italic",
        textDecoration: "underline",
        fontSize: "24px",
        textAlign: "center",
        paddingTop: "24px",
        paddingBottom: "32px",
      });
      expect(preview).toHaveTextContent("Hello <script>text</script>");
      expect(preview.querySelector("script")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: labels.bold }));
      expect(screen.getByRole("button", { name: labels.bold })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    },
  );
  it("bounds spacing, rejects unsafe colors and clones formatting independently", () => {
    expect(
      formTextStyle({
        marginTop: -20,
        marginBottom: Infinity,
        color: "url(javascript:test)",
      }),
    ).toMatchObject({ paddingTop: 0, paddingBottom: 0, color: undefined });
    expect(formTextStyle({ marginTop: 500, color: "#f00" })).toMatchObject({
      paddingTop: 80,
      color: "#ff0000",
    });
    const form = {
      ...createForm("en"),
      blocks: [
        { id: "text", title: "", text: "Hello", textStyle: { bold: true } },
      ],
    };
    const clone = duplicateForm(form);
    expect(clone.blocks[0].textStyle).toEqual({ bold: true });
    expect(clone.blocks[0].textStyle).not.toBe(form.blocks[0].textStyle);
  });
});
