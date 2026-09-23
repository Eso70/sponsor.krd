import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TemplateLinkLabel } from "./TemplateLinkLabel";

describe("TemplateLinkLabel", () => {
  it("keeps the editable title separate from the static English platform name", () => {
    const { container } = render(
      <TemplateLinkLabel
        link={{
          id: "link-1",
          platform: "whatsapp",
          url: "https://wa.me/9647502485829",
          display_name: "Talk to our team",
          description: "This must not replace the platform name",
          is_active: true,
        }}
      />,
    );

    expect(screen.getByText("Talk to our team")).toBeVisible();
    expect(screen.getByText("WhatsApp")).toBeVisible();
    expect(screen.getByText("07502485829")).toBeVisible();
    expect(
      container.querySelector("[data-template-platform-name]"),
    ).toHaveClass("text-xs", "font-sans");
    expect(
      container.querySelector("[data-template-link-identity]"),
    ).toHaveClass("text-[11px]", "font-medium", "opacity-65");
    expect(
      container.querySelector("[data-template-platform-name]")?.parentElement,
    ).toBe(
      container.querySelector("[data-template-link-identity]")?.parentElement,
    );
    expect(
      container.querySelector("[data-template-link-details]"),
    ).toHaveTextContent("WhatsApp-07502485829");
    expect(
      container.querySelector("[data-template-link-details]"),
    ).toHaveClass("gap-1");
    expect(
      screen.queryByText("This must not replace the platform name"),
    ).not.toBeInTheDocument();
  });
});
