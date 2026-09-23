import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { BusinessLanding } from "./BusinessLanding";

vi.mock("next/image", () => ({
  default: ({
    fill: _fill,
    unoptimized: _unoptimized,
    ...props
  }: ComponentProps<"img"> & { fill?: boolean; unoptimized?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element -- deterministic test double for next/image
    <img {...props} alt={props.alt || ""} />
  ),
}));

vi.mock("@/components/home/CustomScrollbar", () => ({
  CustomScrollbar: () => null,
}));

vi.mock("@/lib/utils/cursor-theme", () => ({
  applyCursorColor: vi.fn().mockResolvedValue(undefined),
  resetCursorColor: vi.fn(),
}));

const business = {
  id: "business-1",
  name: "North Studio",
  subdomain: "north",
  logo: "/logo.png",
  website_color: "#2563eb",
  footer_text: "Independent design and production studio.",
  footer_phone: "+964 750 000 0000",
  whatsapp_enabled: true,
};

describe("BusinessLanding", () => {
  it("shows a simple hero and published Linktree cards", () => {
    const { container } = render(
      <BusinessLanding
        business={business}
        linktrees={[
          {
            id: "links-1",
            name: "Customer links",
            uid: "customer-links",
            seo_name: "studio-links",
            subtitle: "Official contact channels",
            image: "/preview.png",
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "لینکترییەکانت بە ئاسانی دروست بکە و بەڕێوەیان ببە",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "لینکترییە بڵاوکراوەکان", level: 2 }),
    ).toBeInTheDocument();
    expect(container.querySelector("main")?.querySelectorAll("section")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "لینکترییەکان ببینە" })).not.toBeInTheDocument();
    expect(
      container.querySelector('a[href="/linktree/studio-links"]'),
    ).toMatchObject({ target: "_blank", rel: "noopener noreferrer" });
    expect(screen.getByText("Official contact channels")).toBeInTheDocument();
    expect(container.querySelector('a[href="tel:+9647500000000"]')).toBeInTheDocument();
    const carousel = screen.getByRole("group", { name: "Mobile template carousel" });
    expect(container.querySelectorAll('[aria-label$="mobile preview"]')).toHaveLength(3);
    const activeTemplate = carousel.querySelector('[aria-live="polite"]');
    const initialTemplate = activeTemplate?.textContent;
    fireEvent.click(screen.getByRole("button", { name: "Next template" }));
    expect(activeTemplate?.textContent).not.toBe(initialTemplate);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(container.querySelector('a[href*="/business"]')).not.toBeInTheDocument();
  });

  it("omits the gallery and its links when no Linktrees are published", () => {
    const { container } = render(
      <BusinessLanding
        business={{ ...business, footer_phone: null, whatsapp_enabled: false }}
        linktrees={[]}
      />,
    );

    expect(container.querySelector("main")?.querySelectorAll("section")).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: "لینکترییە بڵاوکراوەکان" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "لینکترییەکان ببینە" })).not.toBeInTheDocument();
    expect(screen.queryByText("No pages yet")).not.toBeInTheDocument();
  });
});
