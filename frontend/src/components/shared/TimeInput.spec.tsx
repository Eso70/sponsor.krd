import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TimeInput, parseTypedTime } from "./TimeInput";

describe("parseTypedTime", () => {
  it("reads both notations", () => {
    expect(parseTypedTime("21:30")).toBe("21:30");
    expect(parseTypedTime("9:30 pm")).toBe("21:30");
    expect(parseTypedTime("0930PM")).toBe("21:30");
    // A bare time is taken at face value rather than second-guessed.
    expect(parseTypedTime("09:30")).toBe("09:30");
    expect(parseTypedTime("12:00 am")).toBe("00:00");
    expect(parseTypedTime("12:00 pm")).toBe("12:00");
  });

  it("rejects impossible times", () => {
    expect(parseTypedTime("25:00")).toBeNull();
    expect(parseTypedTime("10:75")).toBeNull();
    expect(parseTypedTime("13:00 pm")).toBeNull();
    expect(parseTypedTime("")).toBeNull();
  });
});

describe("TimeInput", () => {
  it.each([
    ["00:00", "12:00 AM"], ["12:00", "12:00 PM"], ["18:05", "06:05 PM"],
  ])("switches notation without changing %s", async (value, display) => {
    const change = vi.fn();
    render(<TimeInput label="Time" locale="en" value={value} onChange={change} />);
    fireEvent.click(screen.getByRole("button", { name: "Open Time" }));
    fireEvent.click(await screen.findByRole("button", { name: "24h" }));
    expect(screen.getByRole("textbox", { name: "Time" })).toHaveValue(value);
    expect(screen.getByRole("button", { name: "24h" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("group", { name: "Period" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("option").filter(option => option.parentElement?.getAttribute("aria-label") === "Hour")).toHaveLength(24);
    fireEvent.click(screen.getByRole("button", { name: "12h" }));
    expect(screen.getByRole("textbox", { name: "Time" })).toHaveValue(display);
    expect(screen.getByRole("group", { name: "Period" })).toBeInTheDocument();
    expect(change).not.toHaveBeenCalled();
  });

  it("selects midnight and late hours in 24-hour mode and accepts typed time", async () => {
    const change = vi.fn();
    render(<TimeInput label="Time" locale="en" value="18:05" onChange={change} />);
    fireEvent.click(screen.getByRole("button", { name: "Open Time" }));
    fireEvent.click(await screen.findByRole("button", { name: "24h" }));
    const hours = screen.getByRole("group", { name: "Hour" });
    fireEvent.click(within(hours).getByText("00"));
    expect(change).toHaveBeenLastCalledWith("00:05");
    fireEvent.click(within(hours).getByText("23"));
    expect(change).toHaveBeenLastCalledWith("23:05");
    const field = screen.getByRole("textbox", { name: "Time" });
    fireEvent.change(field, { target: { value: "21:37" } });
    fireEvent.blur(field);
    expect(change).toHaveBeenLastCalledWith("21:37");
  });

  it("uses a custom popup, supports keyboard selection, and restores focus", async () => {
    const change = vi.fn();
    render(<TimeInput label="Time" locale="en" value="09:00" onChange={change} />);
    expect(screen.getByRole("textbox", { name: "Time" })).toHaveAttribute("type", "text");
    const trigger = screen.getByRole("button", { name: "Open Time" });
    fireEvent.click(trigger);
    const group = await screen.findByRole("group", { name: "Hour" });
    const selected = group.querySelector<HTMLButtonElement>('[aria-selected="true"]')!;
    fireEvent.keyDown(selected, { key: "ArrowDown" });
    expect(change).toHaveBeenCalledWith("10:00");
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Time" })).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
  it("accepts a single-digit typed hour and lets an optional value be cleared", () => {
    const change = vi.fn();
    render(<TimeInput label="Time" value="09:00" onChange={change} />);
    const field = screen.getByRole("textbox", { name: "Time" });
    fireEvent.change(field, { target: { value: "9:30" } }); fireEvent.blur(field);
    expect(change).toHaveBeenCalledWith("09:30");
    fireEvent.change(field, { target: { value: "" } }); fireEvent.blur(field);
    expect(change).toHaveBeenLastCalledWith("");
  });
  it.each([
    { locale: "ar" as const, open: "فتح الوقت", hour: "الساعة", minute: "الدقيقة", now: "الآن", done: "تم" },
    { locale: "en" as const, open: "Open Time", hour: "Hour", minute: "Minute", now: "Now", done: "Done" },
  ])("localizes the time picker in $locale", async ({ locale, open, hour, minute, now, done }) => {
    render(<TimeInput label={locale === "ar" ? "الوقت" : "Time"} locale={locale} value="09:00" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: open }));
    expect(await screen.findByRole("group", { name: hour })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: minute })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: now })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: done })).toBeInTheDocument();
  });

  it("opens from the field while leaving manual entry available", async () => {
    const change = vi.fn();
    render(<TimeInput locale="en" label="Time" value="09:00" onChange={change} />);
    const field = screen.getByRole("textbox", { name: "Time" });
    fireEvent.click(field);
    expect(await screen.findByRole("dialog", { name: "Time" })).toBeInTheDocument();
    expect(field).toHaveFocus();
    fireEvent.change(field, { target: { value: "10:30 PM" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(change).toHaveBeenCalledWith("22:30");
  });

  it("shows the stored 24-hour value in 12-hour form", () => {
    render(<TimeInput label="کاتی کردنەوە" value="18:05" onChange={vi.fn()} />);
    expect(screen.getByLabelText("کاتی کردنەوە")).toHaveValue("06:05 PM");
  });

  it("reports a typed time back in 24-hour form", () => {
    const onChange = vi.fn();
    render(<TimeInput label="کاتی داخستن" value="09:00" onChange={onChange} />);
    const field = screen.getByLabelText("کاتی داخستن");
    fireEvent.change(field, { target: { value: "0230 pm" } });
    fireEvent.blur(field);
    expect(onChange).toHaveBeenCalledWith("14:30");
  });

  it("keeps the last good time when the entry is unreadable", () => {
    const onChange = vi.fn();
    render(<TimeInput label="کات" value="09:00" onChange={onChange} />);
    const field = screen.getByLabelText("کات");
    fireEvent.change(field, { target: { value: "99:99" } });
    fireEvent.blur(field);
    expect(onChange).not.toHaveBeenCalled();
    expect(field).toHaveValue("09:00 AM");
  });

  it("opens the wheels and commits a chosen hour", async () => {
    const onChange = vi.fn();
    render(<TimeInput label="کات" value="09:00" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("کردنەوەی کات"));
    const hours = await screen.findByRole("group", { name: "کاتژمێر" });
    fireEvent.click(within(hours).getByText("11"));
    expect(onChange).toHaveBeenCalledWith("11:00");
  });
});

function within(element: HTMLElement) {
  return {
    getByText: (text: string) => {
      const match = Array.from(element.querySelectorAll("button")).find(
        (button) => button.textContent?.trim() === text,
      );
      if (!match) throw new Error(`No button labelled ${text}`);
      return match;
    },
  };
}
