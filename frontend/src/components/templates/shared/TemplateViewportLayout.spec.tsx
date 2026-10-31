import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TemplateMediaContext } from "./TemplateMediaContext";
import { TemplateViewportLayout } from "./TemplateViewportLayout";

describe("TemplateViewportLayout", () => {
  it("keeps the header, main region, and footer in natural flow", () => {
    const { container } = render(
      <TemplateViewportLayout
        isPreview
        header={<header>Profile</header>}
        main={<button type="button">Contact</button>}
        footer={<footer>Footer</footer>}
      />,
    );

    const layout = container.querySelector("[data-template-viewport-layout]");
    const header = screen.getByRole("banner");
    const main = screen.getByRole("main");
    const footer = screen.getByText("Footer").closest("footer")!;

    expect(layout).toHaveClass("min-h-full");
    expect(layout).not.toHaveClass("flex");
    expect(main).not.toHaveClass("flex-1", "items-center");
    expect(
      header.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      main.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("uses the small viewport height for public pages", () => {
    const { container } = render(
      <TemplateViewportLayout
        isPreview={false}
        header={<header>Profile</header>}
        main={<div>Actions</div>}
        footer={<footer>Footer</footer>}
      />,
    );

    expect(
      container.querySelector("[data-template-viewport-layout]"),
    ).toHaveClass("min-h-[100svh]");
  });
});

it.each([false, true])("shares readable opening hours between public pages and dashboard previews (preview=%s)", isPreview => {
  const { container } = render(<TemplateMediaContext.Provider value={{ banner: { enabled: false, mode: "image", images: [] }, seo: { version: 1, business: { hours: { days: ["Mo", "Tu"], opens: "01:00", closes: "23:00" } } } }}>
    <TemplateViewportLayout isPreview={isPreview} header={<header>Profile</header>} main={<div>Actions</div>} />
  </TemplateMediaContext.Provider>);
  fireEvent.click(container.querySelector("summary")!);
  expect(screen.getByText("01:00 AM")).toBeVisible();
  expect(screen.getByText("11:00 PM")).toBeVisible();
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
});

it("keeps optional business details after primary actions and out of the profile header", () => {
  const {container} = render(<TemplateMediaContext.Provider value={{banner: {enabled: false, mode: "image", images: []}, seo: {version: 1, business: {services: "Consulting"}}}}>
    <TemplateViewportLayout isPreview header={<header>Profile</header>} main={<a href="https://example.com">Contact</a>} />
  </TemplateMediaContext.Provider>);
  const contact = screen.getByRole("link", {name: "Contact"});
  const details = container.querySelector("details")!;
  expect(contact.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByRole("banner")).not.toContainElement(details);
  expect(screen.getByText("Consulting")).not.toBeVisible();
});
