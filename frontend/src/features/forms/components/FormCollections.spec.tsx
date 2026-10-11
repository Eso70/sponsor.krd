import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormsGrid } from "./FormsGrid";
import { FormsTable } from "./FormsTable";
import { createForm } from "../forms-model";
import { formsCopy } from "../forms-copy";

describe("shared form collection presentation", () => {
  it.each(["grid", "table"] as const)(
    "%s displays persistent images, traffic, metadata and public links",
    (variant) => {
      const copy = formsCopy("en");
      const form = {
        ...createForm("en"),
        name: "Contact",
        status: "active" as const,
        slug: "contact",
        logo: "/images/company.png",
        description: "Our customer contact form",
        createdAt: "2026-10-10T12:00:00Z",
        views: 42,
        interactions: 12,
        submissionCount: 9,
      };
      const Component = variant === "grid" ? FormsGrid : FormsTable;
      const { container } = render(
        <Component
          forms={[form]}
          copy={copy}
          locale="en"
          filtered={false}
          archived={false}
          actions={{
            onAnalytics: vi.fn(),
            onEdit: vi.fn(),
            onArchive: vi.fn(),
            onDelete: vi.fn(),
            onOpen: vi.fn(),
          }}
        />,
      );
      expect(
        screen.getAllByRole("img", { name: "Contact" })[0],
      ).toHaveAttribute("src", form.logo);
      expect(screen.getAllByText(form.description).length).toBeGreaterThan(0);
      expect(screen.getAllByText("42").length).toBeGreaterThan(0);
      expect(screen.getAllByText("12").length).toBeGreaterThan(0);
      for (const link of screen.getAllByRole("link")) {
        expect(link.getAttribute("href")).toMatch(/\/form\/contact$/);
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      }
      expect(
        screen.getAllByRole("button", { name: copy.copyLink }).length,
      ).toBeGreaterThan(0);
      if (variant === "grid") {
        const grid = container.querySelector(".lg\\:grid-cols-2");
        expect(grid).not.toBeNull();
        expect(grid).toHaveClass("xl:grid-cols-3");
      }
    },
  );
});
