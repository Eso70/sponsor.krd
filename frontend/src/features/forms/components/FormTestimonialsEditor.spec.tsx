import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { FormComponentEditor } from "./FormComponentEditor";
import { FormBlockPreview } from "./FormBlockPreview";
import { formsCopy } from "../forms-copy";
import { formEditorCopy } from "../form-editor-copy";
import { formImageEntries } from "../form-image-entries";
import { createForm, duplicateForm, validateForm } from "../forms-model";
import type { FormContentBlock, FormLanguage } from "../types";
const image = "data:image/png;base64,YQ==";
const second = "data:image/png;base64,Yg==";
function Editor({ language }: { language: FormLanguage }) {
  const [block, setBlock] = useState<FormContentBlock>({
    id: "testimonials",
    type: "testimonials",
    title: "",
    text: "",
    testimonials: [
      {
        id: "one",
        image,
        title: "First customer",
        description: "First feedback",
      },
      {
        id: "two",
        image: second,
        title: "Second customer",
        description: "Second feedback",
      },
    ],
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
describe("Testimonials", () => {
  it.each(["en", "ar", "ckb"] as const)(
    "preserves image descriptions through selection and visibility in %s",
    async (language) => {
      render(<Editor language={language} />);
      const labels = formEditorCopy(language);
      const copy = formsCopy(language);
      fireEvent.change(
        screen.getByRole("textbox", { name: labels.testimonialHeadline }),
        { target: { value: "Updated customer" } },
      );
      fireEvent.click(
        screen.getByRole("button", { name: `${labels.customer} 2` }),
      );
      expect(
        screen.getByRole("textbox", { name: labels.testimonialHeadline }),
      ).toHaveValue("Second customer");
      const preview = screen.getByTestId("preview");
      expect(preview.querySelectorAll("article")).toHaveLength(2);
      expect(preview.querySelector("img")).toHaveClass("size-20");
      fireEvent.click(
        within(preview).getByRole("button", {
          name: `${copy.preview}: Second customer`,
        }),
      );
      expect(
        within(
          await screen.findByRole("dialog", { name: "Second customer" }),
        ).getByRole("img"),
      ).toHaveAttribute("src", second);
      fireEvent.click(screen.getByRole("button", { name: copy.close }));
      const toggle = screen.getByRole("switch", {
        name: labels.imageDescriptions,
      });
      expect(toggle).toHaveAttribute("aria-checked", "true");
      fireEvent.click(toggle);
      expect(
        screen.queryByRole("textbox", { name: labels.testimonialHeadline }),
      ).not.toBeInTheDocument();
      expect(
        within(preview).queryByText("Second customer"),
      ).not.toBeInTheDocument();
      expect(
        within(preview).queryByText("Second feedback"),
      ).not.toBeInTheDocument();
      expect(
        within(preview).queryByRole("button", { name: /Second customer/ }),
      ).not.toBeInTheDocument();
      expect(preview.querySelectorAll("img")).toHaveLength(2);
      fireEvent.click(toggle);
      expect(
        screen.getByRole("textbox", { name: labels.testimonialDescription }),
      ).toHaveValue("Second feedback");
      fireEvent.click(
        screen.getByRole("button", { name: `${labels.customer} 1` }),
      );
      expect(
        screen.getByRole("textbox", { name: labels.testimonialHeadline }),
      ).toHaveValue("Updated customer");
      for (const number of [3, 4, 5, 6])
        fireEvent.click(
          screen.getByRole("button", { name: `${labels.customer} ${number}` }),
        );
      expect(preview.querySelectorAll("article")).toHaveLength(6);
      for (const number of [6, 1, 1, 1])
        fireEvent.click(
          screen.getByRole("button", {
            name: `${copy.remove} ${labels.customer} ${number}`,
          }),
        );
      expect(preview.querySelectorAll("article")).toHaveLength(2);
      expect(
        screen.getByRole("button", {
          name: `${copy.remove} ${labels.customer} 1`,
        }),
      ).toBeDisabled();
    },
  );
  it("migrates legacy testimonials and clones image records independently", () => {
    const block: FormContentBlock = {
      id: "legacy",
      type: "testimonials",
      title: "",
      text: "",
      images: [image, second],
      items: [{ id: "old", title: "Customer", text: "Feedback" }],
    };
    const testimonials = formImageEntries(block);
    expect(testimonials[0]).toMatchObject({
      image,
      title: "Customer",
      description: "Feedback",
    });
    const form = {
      ...createForm("en"),
      name: "Testimonials",
      blocks: [{ ...block, testimonials }],
    };
    const clone = duplicateForm(form);
    expect(clone.blocks[0].testimonials?.[0]).toMatchObject({
      image,
      title: "Customer",
    });
    expect(clone.blocks[0].testimonials?.[0].id).not.toBe(testimonials[0].id);
    expect(
      validateForm({
        ...form,
        blocks: [
          {
            ...block,
            testimonials: [
              ...testimonials,
              {
                id: "unsafe",
                image: "https://example.com/image.svg",
                title: "",
                description: "",
              },
            ],
          },
        ],
      }),
    ).toBe("url");
  });
});
