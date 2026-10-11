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
  it("shows the hero without publishing a homepage Linktree list", () => {
    const { container } = render(<BusinessLanding business={business} />);

    expect(
      screen.getByRole("heading", {
        name: "لینکترییەکانت بە ئاسانی دروست بکە و بەڕێوەیان ببە",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "لینکترییە بڵاوکراوەکان" }),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector("main")?.querySelectorAll("section"),
    ).toHaveLength(1);
    expect(container.querySelectorAll('a[href^="/linktree/"]')).toHaveLength(0);
    expect(
      container.querySelector('a[href="#business-public-workspace"]'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "لینکترییەکان ببینە" }),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('a[href="/linktree/studio-links"]'),
    ).not.toBeInTheDocument();
    expect(screen.getByText(business.footer_text)).toBeInTheDocument();
    expect(
      container.querySelector('a[href="tel:+9647500000000"]'),
    ).toBeInTheDocument();
    const carousel = screen.getByRole("group", {
      name: "پێشبینینی قاڵبەکانی مۆبایل",
    });
    expect(
      container.querySelectorAll('[aria-label$="پێشبینینی مۆبایل"]'),
    ).toHaveLength(3);
    const activeTemplate = carousel.querySelector('[aria-live="polite"]');
    const initialTemplate = activeTemplate?.textContent;
    fireEvent.click(screen.getByRole("button", { name: "قاڵبی دواتر" }));
    expect(activeTemplate?.textContent).not.toBe(initialTemplate);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(
      container.querySelector('a[href*="/business"]'),
    ).not.toBeInTheDocument();
  });

  it("lets visitors switch fixed homepage text to Arabic without changing authored business content", () => {
    render(<BusinessLanding business={business} />);

    fireEvent.click(
      screen.getByRole("button", { name: "گۆڕینی زمان بۆ عەرەبی" }),
    );
    expect(
      screen.getByRole("heading", { name: "أنشئ صفحات روابطك وأدرها بسهولة" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "صفحات الروابط المنشورة" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "معاينة قوالب الهاتف" }),
    ).toBeInTheDocument();
    expect(screen.getByText(business.footer_text)).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("lang", "ar");
    expect(document.cookie).toContain("business_public_locale=ar");
    document.cookie = "business_public_locale=; Path=/; Max-Age=0";
  });

  it("cycles to English while preserving authored business content", () => {
    render(<BusinessLanding business={business} />);
    fireEvent.click(
      screen.getByRole("button", { name: "گۆڕینی زمان بۆ عەرەبی" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "التبديل إلى الإنجليزية" }),
    );
    expect(
      screen.getByRole("heading", {
        name: "Create and manage your Linktrees with ease",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Published Linktrees" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(business.footer_text)).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("lang", "en");
    expect(document.cookie).toContain("business_public_locale=en");
    document.cookie = "business_public_locale=; Path=/; Max-Age=0";
  });

  it("keeps the homepage free of Linktree navigation and empty placeholders", () => {
    const { container } = render(
      <BusinessLanding
        business={{ ...business, footer_phone: null, whatsapp_enabled: false }}
      />,
    );

    expect(
      container.querySelector("main")?.querySelectorAll("section"),
    ).toHaveLength(1);
    expect(
      screen.queryByRole("heading", { name: "لینکترییە بڵاوکراوەکان" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "لینکترییەکان ببینە" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("No pages yet")).not.toBeInTheDocument();
  });
});
