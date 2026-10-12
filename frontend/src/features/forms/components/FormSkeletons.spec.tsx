import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  FormEditorSkeleton,
  FormsCollectionSkeleton,
  PublicFormSkeleton,
  FormsStatsSkeleton,
  FormResponsesSkeleton,
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
    expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  for (const locale of ["en", "ar", "ckb"] as const) {
    it(`announces public loading in ${locale}`, () => {
      const label = formsCopy(locale).loading;
      const { container } = render(
        <PublicFormSkeleton copy={formsCopy(locale)} label={label} />,
      );
      expect(screen.getByRole("status", { name: label })).toHaveAttribute(
        "aria-busy",
        "true",
      );
      expect(
        container.querySelectorAll("[data-skeleton]").length,
      ).toBeGreaterThan(8);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: formsCopy(locale).submit }),
      ).toBeDisabled();
    });
  }
  it.each(["en", "ar", "ckb"] as const)(
    "uses the real editor and analytics labels in %s",
    (locale) => {
      const copy = formsCopy(locale);
      const editor = render(
        <FormEditorSkeleton label={copy.loading} copy={copy} />,
      );
      expect(screen.getByText(copy.name)).toBeInTheDocument();
      expect(screen.getByText(copy.content)).toBeInTheDocument();
      editor.unmount();
      const stats = render(
        <FormsStatsSkeleton copy={copy} compact label={copy.loading} />,
      );
      expect(screen.getByText(copy.interactions)).toBeInTheDocument();
      expect(screen.queryByText(copy.total)).not.toBeInTheDocument();
      stats.unmount();
      render(<FormResponsesSkeleton copy={copy} />);
      expect(
        screen.getByRole("columnheader", { name: copy.answerPreview }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: copy.timeSpent }),
      ).toBeInTheDocument();
    },
  );
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
