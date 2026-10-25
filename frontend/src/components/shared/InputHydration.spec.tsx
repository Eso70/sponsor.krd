import { act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { ModalTextInput } from "./ModalTextInput";
import { ModalTextArea } from "./ModalTextArea";
import { NumberInput } from "./NumberInput";
import { FormPreview } from "@/features/forms/components/FormPreview";
import { createForm, createQuestion } from "@/features/forms/forms-model";

async function checkHydration(
  element: React.ReactNode,
  verify?: (container: HTMLElement) => void,
) {
  const container = document.createElement("div");
  container.innerHTML = renderToString(element);
  document.body.appendChild(container);
  const before = [...container.querySelectorAll("input,textarea")].map(
    (field) => field.getAttribute("maxlength"),
  );
  const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const recoverable = vi.fn();
  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, element, {
        onRecoverableError: recoverable,
      });
    });
    expect(recoverable).not.toHaveBeenCalled();
    expect(
      errors.mock.calls.filter((args) =>
        args.some((arg) =>
          /hydrat|didn't match|server rendered/i.test(String(arg)),
        ),
      ),
    ).toEqual([]);
    expect(
      [...container.querySelectorAll("input,textarea")].map((field) =>
        field.getAttribute("maxlength"),
      ),
    ).toEqual(before);
    verify?.(container);
  } finally {
    if (root) await act(async () => root!.unmount());
    container.remove();
    errors.mockRestore();
  }
}

describe("declarative input limits and hydration", () => {
  it("renders the same default and explicit limits on the server and client", async () => {
    await checkHydration(
      <>
        <ModalTextInput aria-label="Text" />
        <ModalTextInput type="email" aria-label="Email" />
        <ModalTextInput type="tel" aria-label="Phone" />
        <ModalTextInput maxLength={63} aria-label="Explicit" />
        <ModalTextArea aria-label="Description" />
        <ModalTextArea aria-label="Short description" maxLength={200} />
        <NumberInput
          aria-label="Price"
          decimalOnly
          value={null}
          onValueChange={() => undefined}
        />
      </>,
      (container) => {
        expect(
          [...container.querySelectorAll("input,textarea")].map((field) =>
            field.getAttribute("maxlength"),
          ),
        ).toEqual(["255", "254", "32", "63", "5000", "200", "32"]);
      },
    );
  });
  it.each(["en", "ar", "ckb"] as const)(
    "hydrates the public form's phone, age and product fields without attribute changes (%s)",
    async (language) => {
      const form = {
        ...createForm(language),
        name: "Contact",
        questions: [
          {
            ...createQuestion("short"),
            id: "age",
            label: "Age",
            labelKey: "age" as const,
          },
          { ...createQuestion("phone"), id: "phone", label: "Phone" },
          {
            ...createQuestion("product"),
            id: "products",
            label: "Products",
            productSelection: {
              currency: "USD" as const,
              items: [{ id: "one", name: "Item", unit: "unit", unitPrice: 5 }],
            },
          },
        ],
      };
      await checkHydration(
        <FormPreview presentation="public" form={form} />,
        (container) => {
          const quantity = container.querySelector(
            'input[inputmode="decimal"]',
          );
          expect(quantity).toHaveAttribute("maxlength", "255");
          expect(container.querySelector('input[type="tel"]')).toHaveAttribute(
            "maxlength",
            "1000",
          );
        },
      );
    },
  );
});
