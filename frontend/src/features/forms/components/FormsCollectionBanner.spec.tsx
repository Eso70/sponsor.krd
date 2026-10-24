import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PageListBanner } from "@/components/shared/PageListBanner";
import { FormsGrid } from "./FormsGrid";
import { FormsTable } from "./FormsTable";
import { formsCopy } from "../forms-copy";
import { createForm } from "../forms-model";

describe("saved Form collection banners", () => {
  it("falls back on a failed image and recovers when its saved image changes", () => {
    const { container, rerender } = render(
      <PageListBanner src="/images/upload/first.png" />,
    );
    fireEvent.error(screen.getByAltText(""));
    expect(container.querySelector("img")).toBeNull();
    rerender(<PageListBanner src="/images/upload/updated.png" compact />);
    expect(screen.getByAltText("")).toHaveAttribute(
      "src",
      expect.stringContaining("/images/upload/updated.png"),
    );
  });

  it.each([undefined, null, ""])(
    "renders the same decorative fallback for an absent cover",
    (src) => {
      const { container } = render(<PageListBanner src={src} />);
      expect(container.querySelector("img")).toBeNull();
      expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    },
  );

  it.each([FormsGrid, FormsTable])(
    "shows saved covers only in the grid, keeping tables compact",
    (View) => {
      const { container } = render(
        <View
          forms={[
            {
              ...createForm("en"),
              id: "saved",
              name: "Saved form",
              banner: "/images/upload/saved.png",
            },
          ]}
          copy={formsCopy("en")}
          actions={{ onEdit: vi.fn(), onDelete: vi.fn() }}
          locale="en"
          filtered={false}
          archived={false}
        />,
      );
      const covers = Array.from(container.querySelectorAll("img")).filter(
        (image) =>
          image.getAttribute("src")?.endsWith("/images/upload/saved.png"),
      );
      expect(covers.length).toBe(View === FormsGrid ? 1 : 0);
      expect(screen.getAllByText("Saved form").length).toBeGreaterThan(0);
    },
  );
});
