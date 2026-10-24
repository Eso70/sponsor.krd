import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModalTextInput } from "./ModalTextInput";

describe("ModalTextInput", () => {
  it("places errors inside an empty field without changing its value", () => {
    render(<ModalTextInput aria-label="Link" value="" onChange={vi.fn()} placeholder="Website" error="Enter a link value" />);
    const input = screen.getByRole("textbox", { name: "Link" });
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "Enter a link value");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.parentElement).toContainElement(screen.getByRole("alert"));
    expect(input).toHaveAttribute("aria-errormessage", screen.getByRole("alert").id);
  });
  it("keeps an invalid value visible with an embedded error and existing help description", () => {
    render(<ModalTextInput aria-label="Link" value="bad link" onChange={vi.fn()} error="Enter a valid URL" aria-describedby="help" />);
    const input = screen.getByRole("textbox", { name: "Link" });
    expect(input).toHaveValue("bad link");
    expect(input.parentElement).toContainElement(screen.getByRole("alert"));
    expect(input.getAttribute("aria-describedby")).toBe(`help ${screen.getByRole("alert").id}`);
  });
  it.each(["ltr", "rtl"] as const)(
    "places an action inside a %s field without changing its value",
    (dir) => {
      const click = vi.fn();
      render(
        <ModalTextInput
          dir={dir}
          aria-label="Question"
          defaultValue="Your name"
          endAction={
            <button type="button" onClick={click}>
              Required
            </button>
          }
        />,
      );
      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button", { name: "Required" });
      expect(input.parentElement).toContainElement(button);
      expect(input.parentElement).toHaveAttribute("dir", dir);
      expect(input).toHaveClass("!pe-32");
      fireEvent.click(button);
      expect(click).toHaveBeenCalledOnce();
      expect(input).toHaveValue("Your name");
    },
  );
  it("keeps the suffix separate from the editable value and forwards field attributes", () => {
    const onChange = vi.fn();
    render(
      <ModalTextInput
        aria-label="Subdomain"
        dir="ltr"
        suffix=".sponsor.krd"
        defaultValue="help"
        maxLength={63}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("textbox", { name: "Subdomain" });
    expect(input).toHaveValue("help");
    expect(input).toHaveAttribute("maxlength", "63");
    expect(screen.getByText(".sponsor.krd")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "support" } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue("support");
  });
  it("preserves disabled and invalid states with a suffix", () => {
    render(
      <ModalTextInput
        aria-label="Subdomain"
        suffix=".sponsor.krd"
        disabled
        hasError
        aria-describedby="error"
      />,
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-describedby",
      "error",
    );
  });
});
