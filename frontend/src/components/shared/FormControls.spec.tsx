import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckboxField } from "./CheckboxField";
import { DateInput, DateTimeInput } from "./DateTimeInput";
import { CustomSelect } from "./CustomSelect";

describe("shared form controls", () => {
  it("renders an empty select safely and disables interaction", () => {
    render(
      <CustomSelect label="بزنس" value="" options={[]} onChange={vi.fn()} />,
    );

    const trigger = screen.getByRole("button", {
      name: /هیچ هەڵبژاردەیەک نییە/,
    });
    expect(trigger).toBeDisabled();
  });

  it("keeps an explicit select accent in its portaled menu", () => {
    render(
      <CustomSelect
        label="Plan"
        value="basic"
        options={[
          { value: "basic", label: "Basic" },
          { value: "ultra", label: "Ultra" },
        ]}
        onChange={vi.fn()}
        accent="#25F4EE"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Basic" });
    expect(trigger.parentElement).toHaveStyle({
      "--theme-primary": "#25F4EE",
      "--theme-css": "#25F4EE",
    });

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toHaveStyle({
      "--theme-primary": "#25F4EE",
      "--theme-css": "#25F4EE",
    });
    expect(screen.getByRole("option", { name: "Basic" })).toHaveAttribute("aria-selected", "true");
  });

  it("keeps a continuous gradient in the select trigger and portal", () => {
    render(
      <CustomSelect
        label="Status"
        value="active"
        options={[
          { value: "active", label: "Active" },
          { value: "paused", label: "Paused" },
        ]}
        onChange={vi.fn()}
        accent="gradient:to-r:#25F4EE:#FE2C55"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Active" });
    fireEvent.click(trigger);

    const gradient = "linear-gradient(to right, #25F4EE 0%, #FE2C55 100%)";
    expect(trigger.parentElement).toHaveStyle({ "--theme-css": gradient });
    expect(screen.getByRole("listbox")).toHaveStyle({
      "--theme-css": gradient,
    });
    expect(screen.getByRole("option", { name: "Active" })).toHaveAttribute("aria-selected", "true");
  });

  it("reports checkbox changes through a real checkbox input", () => {
    const onChange = vi.fn();
    render(
      <CheckboxField
        checked={false}
        onChange={onChange}
        label="کەناڵی ئاگاداری"
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "کەناڵی ئاگاداری" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("fills selected checkboxes with the complete shared theme surface", () => {
    render(
      <CheckboxField checked onChange={vi.fn()} label="Selected channel" />,
    );

    const input = screen.getByRole("checkbox", { name: "Selected channel" });
    expect(input.nextElementSibling).toHaveClass("theme-fill");
  });

  it("selects date and time through the custom picker", async () => {
    const onChange = vi.fn();
    render(
      <DateTimeInput label="کاتی بڵاوکردنەوە" value="" onChange={onChange} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "کردنەوەی کاتی بڵاوکردنەوە" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "ئەمڕۆ" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
    );
  });

  it("opens from the date field and keeps manual typing focused", async () => {
    const change = vi.fn();
    render(<DateTimeInput locale="en" label="Schedule" value="2028-07-20T14:35" onChange={change} />);
    const field = screen.getByRole("textbox", { name: "Schedule" });
    fireEvent.click(field);
    expect(await screen.findByRole("dialog", { name: "Schedule" })).toBeInTheDocument();
    expect(field).toHaveFocus();
    fireEvent.change(field, { target: { value: "28/07/21" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(change).toHaveBeenCalledWith("2028-07-21T14:35");
    expect(screen.getByRole("dialog", { name: "Schedule" })).toBeInTheDocument();
  });

  it("allows historical dates while respecting explicit bounds", () => {
    const change = vi.fn();
    render(<DateInput locale="en" label="Date" value="" min="2020-01-01" max="2025-12-31" onChange={change} />);
    const field = screen.getByRole("textbox", { name: "Date" });
    fireEvent.change(field, { target: { value: "24/07/20" } }); fireEvent.blur(field);
    expect(change).toHaveBeenCalledWith("2024-07-20");
    change.mockClear();
    fireEvent.change(field, { target: { value: "19/07/20" } }); fireEvent.blur(field);
    expect(change).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("returns a date-only value through the reusable date picker", () => {
    const onChange = vi.fn();
    render(
      <DateInput label="بەرواری بەسەرچوون" value="" onChange={onChange} />,
    );

    const input = screen.getByRole("textbox", {
      name: "بەرواری بەسەرچوون",
    });
    fireEvent.change(input, { target: { value: "28/07/20" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith("2028-07-20");
  });

  it("accepts a valid typed value in the documented format", () => {
    const onChange = vi.fn();
    render(<DateTimeInput label="کاتی کۆتایی" value="" onChange={onChange} />);

    const input = screen.getByRole("textbox", { name: "کاتی کۆتایی" });
    fireEvent.change(input, { target: { value: "28/07/20" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith("2028-07-20T00:00");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("rejects impossible typed calendar dates", () => {
    const onChange = vi.fn();
    render(<DateTimeInput label="کاتی کۆتایی" value="" onChange={onChange} />);

    const input = screen.getByRole("textbox", { name: "کاتی کۆتایی" });
    fireEvent.change(input, { target: { value: "28/02/31" } });
    fireEvent.blur(input);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("masks two-digit year, month, and day while typing", () => {
    const onChange = vi.fn();
    render(<DateTimeInput label="کاتی کۆتایی" value="" onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "کاتی کۆتایی" });

    fireEvent.change(input, { target: { value: "28" } });
    expect(input).toHaveValue("28/");
    fireEvent.change(input, { target: { value: "28/3" } });
    expect(input).toHaveValue("28/03/");
    fireEvent.change(input, { target: { value: "28/03/9" } });
    expect(input).toHaveValue("28/03/09");
  });

  it("accepts February 29 only in a leap year", () => {
    const onChange = vi.fn();
    render(<DateTimeInput label="کاتی کۆتایی" value="" onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "کاتی کۆتایی" });

    fireEvent.change(input, { target: { value: "28/02/29" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith("2028-02-29T00:00");
  });

  it("prevents February 29 in a non-leap year", () => {
    render(<DateTimeInput label="کاتی کۆتایی" value="" onChange={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: "کاتی کۆتایی" });

    fireEvent.change(input, { target: { value: "27/02/29" } });
    expect(input).toHaveValue("27/02/2");
  });
});
