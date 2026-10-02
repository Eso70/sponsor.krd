import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  STANDARD_TEMPLATE_ACTION_LIST_CLASS,
  STANDARD_TEMPLATE_BUTTON_SIZE_CLASS,
  TemplateActionButton,
  TemplateActionButtonList,
} from "./TemplateActionButton";

describe("template action sizing", () => {
  it("retains native navigation if the tracking/dialog enhancement fails", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<TemplateActionButton href="https://example.com" onClick={() => { throw new Error("unavailable"); }}>Destination</TemplateActionButton>);
    expect(fireEvent.click(screen.getByRole("link", { name: "Destination" }))).toBe(true);
    error.mockRestore();
  });
  it("keeps a crawlable destination and handles ordinary clicks exactly once", () => {
    const click = vi.fn();
    render(<TemplateActionButton href="https://example.com" onClick={click}>Website</TemplateActionButton>);
    const link = screen.getByRole("link", { name: "Website" });
    expect(link).toHaveAttribute("href", "https://example.com");
    fireEvent.click(link);
    expect(click).toHaveBeenCalledTimes(1);
    fireEvent.click(link, { ctrlKey: true });
    expect(click).toHaveBeenCalledTimes(1);
  });
  it("uses one button height and one list spacing preset", () => {
    const { container } = render(
      <TemplateActionButtonList isEmpty={false}>
        <TemplateActionButton onClick={vi.fn()}>Contact</TemplateActionButton>
      </TemplateActionButtonList>,
    );

    expect(screen.getByRole("button", { name: "Contact" })).toHaveClass(
      ...STANDARD_TEMPLATE_BUTTON_SIZE_CLASS.split(" "),
    );
    expect(container.firstElementChild).toHaveClass(
      ...STANDARD_TEMPLATE_ACTION_LIST_CLASS.split(" "),
    );
  });
});
