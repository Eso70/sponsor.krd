import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  FormEditorSkeleton,
  FormsCollectionSkeleton,
  PublicFormSkeleton,
} from "./FormSkeletons";
import { formsCopy } from "../forms-copy";

describe("form loading placeholders", () => {
  it("matches the table view without interactive placeholder controls", () => {
    const { container } = render(
      <FormsCollectionSkeleton label="Loading" viewMode="table" />,
    );
    expect(screen.getByRole("status", { name: "Loading" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(
      container.querySelectorAll("[data-skeleton-table-row]"),
    ).toHaveLength(6);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  for (const locale of ["en", "ar", "ckb"] as const) {
    it(`announces public loading in ${locale}`, () => {
      const label = formsCopy(locale).loading;
      const { container } = render(<PublicFormSkeleton label={label} />);
      expect(screen.getByRole("status", { name: label })).toHaveAttribute(
        "aria-busy",
        "true",
      );
      expect(
        container.querySelectorAll("[data-skeleton]").length,
      ).toBeGreaterThan(8);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
  }
  it("shows only the preview when opening a read-only preview", () => {
    const { container, rerender } = render(
      <FormEditorSkeleton label="Loading" />,
    );
    const editorCount = container.querySelectorAll("[data-skeleton]").length;
    rerender(<FormEditorSkeleton label="Loading" previewOnly />);
    expect(container.querySelectorAll("[data-skeleton]").length).toBeLessThan(
      editorCount,
    );
  });
});
