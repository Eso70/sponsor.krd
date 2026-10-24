import { PageManagementCollection } from "@/components/shared/PageManagementCollection";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  FormEditorSkeleton,
  PublicFormSkeleton,
  FormsStatsSkeleton,
  FormsPageSkeleton,
  FormResponsesSkeleton,
} from "./FormSkeletons";
import { formsCopy } from "../forms-copy";

describe("form loading placeholders", () => {
  it("matches the table view without interactive placeholder controls", () => {
    const { container } = render(
      <PageManagementCollection loading loadingLabel="Loading" viewMode="table" columns={7}>{null}</PageManagementCollection>,
    );
    expect(screen.getByRole("status", { name: "Loading" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(container.querySelectorAll("[data-skeleton-table-row]")).toHaveLength(6);
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
      expect(screen.queryByText(copy.interactions)).not.toBeInTheDocument();
      expect(stats.container.querySelectorAll("[data-stat-card]")).toHaveLength(6);
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


it.each(["grid", "table"] as const)("shares the %s loading layout with Pages and contains no fake buttons", (viewMode) => {
  const { container } = render(<PageManagementCollection loading loadingLabel="Loading forms" viewMode={viewMode} selectable columns={8}>{null}</PageManagementCollection>);
  expect(screen.getAllByRole("status")).toHaveLength(1);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  if (viewMode === "grid") expect(container.querySelectorAll("article:not([data-stat-card])")).toHaveLength(6);
  else expect(container.querySelectorAll("[data-skeleton-table-row]")).toHaveLength(6);
});

it("uses one management-page loading announcement with the matching six statistic cards", () => {
  const copy = formsCopy("en");
  const { container } = render(<FormsPageSkeleton copy={copy} />);
  expect(screen.getAllByRole("status")).toHaveLength(1);
  expect(screen.getByRole("status", { name: copy.loading })).toBeInTheDocument();
  expect(container.querySelectorAll("[data-stat-card]")).toHaveLength(6);
  expect(container.querySelectorAll("article:not([data-stat-card])")).toHaveLength(6);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
