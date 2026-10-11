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
    id: "products",
    type: "products",
    title: "",
    text: "",
    products: [
      { id: "one", image, title: "First", description: "First benefits" },
      {
        id: "two",
        image: second,
        title: "Second",
        description: "Second benefits",
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
describe("Product details and benefits", () => {
  it.each(["en", "ar", "ckb"] as const)(
    "keeps per-product details and images paired in %s",
    async (language) => {
      render(<Editor language={language} />);
      const labels = formEditorCopy(language);
      const copy = formsCopy(language);
      expect(
        screen.getByRole("textbox", { name: copy.headline }),
      ).toHaveAttribute("maxlength", "30");
      expect(
        screen.getByRole("textbox", { name: copy.descriptionLabel }),
      ).toHaveAttribute("maxlength", "50");
      fireEvent.change(
        screen.getByRole("textbox", { name: labels.productHeadline }),
        { target: { value: "Updated first" } },
      );
      fireEvent.click(
        screen.getByRole("button", { name: `${labels.product} 2` }),
      );
      expect(
        screen.getByRole("textbox", { name: labels.productHeadline }),
      ).toHaveValue("Second");
      fireEvent.change(
        screen.getByRole("textbox", { name: labels.productDescription }),
        { target: { value: "Benefit A\nBenefit B" } },
      );
      fireEvent.click(
        screen.getByRole("button", { name: `${labels.product} 1` }),
      );
      expect(
        screen.getByRole("textbox", { name: labels.productHeadline }),
      ).toHaveValue("Updated first");
      expect(
        screen.getByRole("textbox", { name: labels.productDescription }),
      ).toHaveValue("First benefits");
      const preview = screen.getByTestId("preview");
      const cards = preview.querySelectorAll("article");
      expect(cards).toHaveLength(2);
      expect(cards[0]).toHaveTextContent("Updated first");
      expect(cards[0].querySelector("img")).toHaveAttribute("src", image);
      expect(cards[1]).toHaveTextContent("Benefit A Benefit B");
      expect(cards[1].querySelector("img")).toHaveAttribute("src", second);
      fireEvent.click(
        within(preview).getByRole("button", {
          name: `${copy.preview}: Second`,
        }),
      );
      expect(
        within(await screen.findByRole("dialog", { name: "Second" })).getByRole(
          "img",
        ),
      ).toHaveAttribute("src", second);
      fireEvent.click(screen.getByRole("button", { name: copy.close }));
      for (const number of [3, 4, 5])
        fireEvent.click(
          screen.getByRole("button", { name: `${labels.product} ${number}` }),
        );
      expect(
        screen.getByTestId("preview").querySelectorAll("article"),
      ).toHaveLength(5);
      for (const number of [5, 1, 1])
        fireEvent.click(
          screen.getByRole("button", {
            name: `${copy.remove} ${labels.product} ${number}`,
          }),
        );
      expect(
        screen.getByTestId("preview").querySelectorAll("article"),
      ).toHaveLength(2);
      expect(
        screen.getByRole("button", {
          name: `${copy.remove} ${labels.product} 1`,
        }),
      ).toBeDisabled();
    },
  );
  it("maps older image/detail pairs and duplicates products independently", () => {
    const block: FormContentBlock = {
      id: "legacy",
      type: "products",
      title: "",
      text: "",
      images: [image, second],
      items: [{ id: "detail", title: "First", text: "Benefit" }],
    };
    const products = formImageEntries(block);
    expect(products[0]).toMatchObject({
      image,
      title: "First",
      description: "Benefit",
    });
    expect(products[1].image).toBe(second);
    const form = {
      ...createForm("en"),
      name: "Products",
      blocks: [{ ...block, products }],
    };
    const clone = duplicateForm(form);
    expect(clone.blocks[0].products?.[0].id).not.toBe(products[0].id);
    expect(clone.blocks[0].products?.[0].image).toBe(image);
    expect(
      validateForm({
        ...form,
        blocks: [
          {
            ...block,
            products: [
              ...products,
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
