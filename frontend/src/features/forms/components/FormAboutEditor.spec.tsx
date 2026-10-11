import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { FormComponentEditor } from "./FormComponentEditor";
import { FormBlockPreview } from "./FormBlockPreview";
import { formsCopy } from "../forms-copy";
import { formEditorCopy } from "../form-editor-copy";
import type { FormContentBlock, FormLanguage } from "../types";
function Editor({ language }: { language: FormLanguage }) {
  const [block, setBlock] = useState<FormContentBlock>({
    id: "about",
    type: "about",
    title: "",
    text: "",
    images: ["data:image/png;base64,YQ=="],
  });
  const copy = formsCopy(language),
    labels = formEditorCopy(language);
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
describe("About us component", () => {
  it.each(["en", "ar", "ckb"] as const)(
    "preserves hidden images and updates the preview in %s",
    (language) => {
      render(<Editor language={language} />);
      const copy = formsCopy(language),
        labels = formEditorCopy(language);
      const headline = screen.getByRole("textbox", { name: copy.headline });
      expect(headline).toHaveAttribute("maxlength", "20");
      fireEvent.change(headline, { target: { value: "Our business" } });
      fireEvent.change(
        screen.getByRole("textbox", { name: copy.descriptionLabel }),
        { target: { value: "Our story" } },
      );
      const preview = screen.getByTestId("preview");
      expect(preview).toHaveTextContent("Our business");
      expect(preview).toHaveTextContent("Our story");
      expect(preview.querySelector("img")).toBeInTheDocument();
      const toggle = screen.getByRole("switch", { name: labels.image });
      expect(toggle).toHaveAttribute("aria-checked", "true");
      fireEvent.click(toggle);
      expect(preview.querySelector("img")).not.toBeInTheDocument();
      expect(
        screen.queryByText(labels.componentImageHint),
      ).not.toBeInTheDocument();
      fireEvent.click(toggle);
      expect(preview.querySelector("img")).toHaveAttribute(
        "src",
        "data:image/png;base64,YQ==",
      );
      expect(screen.getByText(labels.componentImageHint)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Crop/ }),
      ).not.toBeInTheDocument();
    },
  );
});
