import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { FormWhatsAppDetailsEditor } from "./FormWhatsAppDetailsEditor";
import { defaultFormWhatsAppDetails } from "../form-submission-whatsapp";

it("locks presentation controls while saving and keeps example values read-only", () => {
  const onChange = vi.fn();
  const value = defaultFormWhatsAppDetails("en");
  render(
    <FormWhatsAppDetailsEditor
      value={value}
      locale="en"
      disabled
      onChange={onChange}
    />,
  );
  for (const control of [
    ...screen.getAllByRole("button"),
    ...screen.getAllByRole("textbox"),
    screen.getByRole("switch"),
  ])
    expect(control).toBeDisabled();
  fireEvent.click(screen.getByRole("switch", { name: "Show answer labels" }));
  expect(onChange).not.toHaveBeenCalled();
  expect(
    screen.queryByRole("textbox", { name: "Quantity" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("textbox", { name: "Price" }),
  ).not.toBeInTheDocument();
});
