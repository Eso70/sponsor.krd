import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormCollectionBanner } from "./FormCollectionBanner";
import { PageListBanner } from "@/components/shared/PageListBanner";
import { FormsGrid } from "./FormsGrid";
import { FormsTable } from "./FormsTable";
import { formsCopy } from "../forms-copy";
import { createForm } from "../forms-model";

afterEach(() => vi.useRealTimers());

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
    "shows saved covers in grid and compact table rows",
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
      expect(covers.length).toBe(View === FormsGrid ? 1 : 2);
      expect(screen.getAllByText("Saved form").length).toBeGreaterThan(0);
    },
  );
  it.each([FormsGrid, FormsTable])(
    "rotates and manually changes the saved carousel in each collection view",
    (View) => {
      vi.useFakeTimers();
      const { container } = render(
        <View
          forms={[
            {
              ...createForm("en"),
              id: "carousel",
              name: "Carousel form",
              bannerMode: "carousel",
              bannerImages: [
                "/images/upload/first.png",
                "/images/upload/second.png",
              ],
            },
          ]}
          copy={formsCopy("en")}
          actions={{ onEdit: vi.fn(), onDelete: vi.fn() }}
          locale="en"
          filtered={false}
          archived={false}
        />,
      );
      const gallery = container.querySelector('[data-form-media="banner"]')!;
      const active = () =>
        gallery.querySelector('[data-current-slide="true"] img');
      expect(active()).toHaveAttribute(
        "src",
        expect.stringContaining("first.png"),
      );
      act(() => vi.advanceTimersByTime(3000));
      expect(active()).toHaveAttribute(
        "src",
        expect.stringContaining("second.png"),
      );
      fireEvent.click(gallery.querySelector("[data-media-control]")!);
      expect(active()).toHaveAttribute(
        "src",
        expect.stringContaining("first.png"),
      );
    },
  );
  it("retains cover dimensions when carousel images fail", () => {
    const { container } = render(
      <FormCollectionBanner
        form={{
          ...createForm("en"),
          bannerMode: "carousel",
          bannerImages: [
            "/images/upload/first.png",
            "/images/upload/second.png",
          ],
        }}
        locale="en"
        compact
      />,
    );
    fireEvent.error(
      container.querySelector('[data-current-slide="true"] img')!,
    );
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(container.firstChild).toHaveClass("h-12", "w-20");
  });
  it("does not expose disabled saved banners", () => {
    const { container } = render(
      <FormsGrid
        forms={[
          {
            ...createForm("en"),
            bannerEnabled: false,
            bannerMode: "carousel",
            bannerImages: [
              "/images/upload/hidden.png",
              "/images/upload/hidden2.png",
            ],
          },
        ]}
        copy={formsCopy("en")}
        actions={{ onEdit: vi.fn(), onDelete: vi.fn() }}
        locale="en"
        filtered={false}
        archived={false}
      />,
    );
    expect(container.querySelector('img[src*="hidden"]')).toBeNull();
  });
});
