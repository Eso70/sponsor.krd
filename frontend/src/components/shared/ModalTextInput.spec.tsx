import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModalTextInput } from "./ModalTextInput";

describe("ModalTextInput", () => {
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
