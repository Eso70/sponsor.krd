import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormExportRange } from "./FormExportRange";
import { formsCopy } from "../forms-copy";

vi.mock("@/components/shared/DateTimeInput", () => ({
  DateTimeInput: ({
    label,
    value,
    onChange,
    disabled,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
  }) => (
    <input
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));
const copy = formsCopy("en");
describe("export-only date range", () => {
  it("validates dates and allows inclusive same-day CSV exports", () => {
    const onExport = vi.fn();
    render(
      <FormExportRange
        copy={copy}
        locale="en"
        disabled={false}
        onClose={vi.fn()}
        onExport={onExport}
      />,
    );
    const submit = screen.getByRole("button", { name: copy.exportCsv });
    fireEvent.click(submit);
    expect(screen.getByRole("alert")).toHaveTextContent(copy.exportRangeError);
    expect(onExport).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: copy.exportFrom }), {
      target: { value: "2026-10-10" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: copy.exportTo }), {
      target: { value: "2026-10-09" },
    });
    fireEvent.click(submit);
    expect(onExport).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: copy.exportTo }), {
      target: { value: "2026-10-10" },
    });
    fireEvent.click(submit);
    expect(onExport).toHaveBeenLastCalledWith({
      from: "2026-10-10",
      to: "2026-10-10",
    });
  });
  it("can cancel and prevents export while another operation is running", () => {
    const onExport = vi.fn(),
      onClose = vi.fn();
    const view = render(
      <FormExportRange
        copy={copy}
        locale="en"
        disabled={false}
        onClose={onClose}
        onExport={onExport}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: copy.cancel }));
    expect(onClose).toHaveBeenCalledOnce();
    view.rerender(
      <FormExportRange
        copy={copy}
        locale="en"
        disabled
        onClose={onClose}
        onExport={onExport}
      />,
    );
    expect(screen.getByRole("button", { name: copy.exportCsv })).toBeDisabled();
    expect(onExport).not.toHaveBeenCalled();
  });
});
