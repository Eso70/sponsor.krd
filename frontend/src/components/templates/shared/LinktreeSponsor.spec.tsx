import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TemplateMediaContext } from "./TemplateMediaContext";
import { PublicLinktreeLocaleProvider } from "@/features/business/i18n/public-linktree";
import { LinktreeLegalFooter } from "./LinktreeLegalFooter";
import { TemplateViewportLayout } from "./TemplateViewportLayout";
import type { LinktreeSponsor } from "@linktree/types/linktree-sponsor.cjs";

const sponsor: LinktreeSponsor = { enabled: true, style: "text", name: "Acme", logo: null, url: "/" };
const banner = { enabled: false, mode: "image" as const, images: [] };

describe("shared Linktree sponsorship", () => {
  it.each([
    ["ckb", "سپۆنسەرکراوە لەلایەن"],
    ["ar", "برعاية"],
    ["en", "Sponsored by"],
  ] as const)("renders attribution above the existing legal navigation in %s", (locale, label) => {
    const onSponsorClick = vi.fn();
    const { container } = render(
      <PublicLinktreeLocaleProvider locale={locale}>
        <TemplateMediaContext.Provider value={{ banner, sponsor, onSponsorClick }}>
          <LinktreeLegalFooter color="#334155" />
        </TemplateMediaContext.Provider>
      </PublicLinktreeLocaleProvider>,
    );
    expect(screen.getByText(label)).toBeVisible();
    const link = screen.getByRole("link", { name: "Acme" });
    expect(link).toHaveAttribute("href", "/");
    expect(link).toHaveAttribute("rel", expect.stringContaining("sponsored"));
    const legal = container.querySelector("[data-page-legal-links]")!;
    expect(container.querySelector("[data-linktree-sponsor]")!.compareDocumentPosition(legal) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(link);
    expect(onSponsorClick).toHaveBeenCalledWith("/", "Acme");
    expect(screen.getByRole("link", { name: "Terms" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Privacy" })).toBeVisible();
  });

  it.each([undefined, { ...sponsor, enabled: false }])("keeps existing pages unchanged when sponsorship is disabled/missing", (value) => {
    const { container } = render(<TemplateMediaContext.Provider value={{ banner, sponsor: value }}><LinktreeLegalFooter color="#333333" /></TemplateMediaContext.Provider>);
    expect(container.querySelector("[data-linktree-sponsor]")).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("shows a contained wordmark with an accessible sponsor name and no link when the URL is empty", () => {
    render(<TemplateMediaContext.Provider value={{ banner, sponsor: { ...sponsor, style: "wordmark", logo: "/images/upload/wordmark.png", url: null } }}><LinktreeLegalFooter color="#333333" /></TemplateMediaContext.Provider>);
    expect(screen.getByRole("img", { name: "Acme" })).toHaveClass("object-contain");
    expect(screen.queryByRole("link", { name: "Acme" })).not.toBeInTheDocument();
  });

  it("keeps the drawer preview inert and reserves room above legal links", () => {
    const onSponsorClick = vi.fn();
    const { container } = render(<TemplateMediaContext.Provider value={{ banner, sponsor, preview: true, onSponsorClick }}>
      <TemplateViewportLayout isPreview header={<header>Profile</header>} main={<button>Contact</button>} />
    </TemplateMediaContext.Provider>);
    expect(screen.getByText("Acme")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Acme" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Acme"));
    expect(onSponsorClick).not.toHaveBeenCalled();
    expect(container.querySelector("[data-template-viewport-layout]")?.className).toMatch(/sponsoredViewport/);
  });
});

it("renders an unnamed wordmark with edited introduction and a phone action", () => {
  render(<PublicLinktreeLocaleProvider locale="ckb"><TemplateMediaContext.Provider value={{ banner, sponsor: { ...sponsor, style: "wordmark", name: "", logo: "/images/upload/wordmark.png", intro: "بە هاوکاری", url: "tel:+9647501234567" } }}><LinktreeLegalFooter color="#333333" /></TemplateMediaContext.Provider></PublicLinktreeLocaleProvider>);
  expect(screen.getByText("بە هاوکاری")).toBeVisible();
  expect(screen.queryByText("سپۆنسەرکراوە لەلایەن")).not.toBeInTheDocument();
  expect(screen.getByRole("img", { name: "سپۆنسەر" })).toBeVisible();
  expect(screen.getByRole("link", { name: "سپۆنسەر" })).toHaveAttribute("href", "tel:+9647501234567");
});
it("hides an explicitly cleared introduction", () => {
  render(<TemplateMediaContext.Provider value={{ banner, sponsor: { ...sponsor, intro: "" } }}><LinktreeLegalFooter color="#333333" /></TemplateMediaContext.Provider>);
  expect(screen.getByRole("link", { name: "Acme" })).toBeVisible();
  expect(screen.queryByText("سپۆنسەرکراوە لەلایەن")).not.toBeInTheDocument();
});
