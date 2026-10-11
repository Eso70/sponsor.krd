import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
import { CustomSelect } from "./CustomSelect";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("CustomSelect popover placement", () => {
  it("opens above its trigger through a viewport-bounded portal and closes with Escape", () => {
    vi.stubGlobal("innerHeight", 800);
    vi.stubGlobal("innerWidth", 1024);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 400,
      bottom: 440,
      left: 900,
      right: 1044,
      width: 144,
      height: 40,
      x: 900,
      y: 400,
      toJSON: () => ({}),
    });
    const { container } = render(
      <CustomSelect
        label="Personal information"
        value=""
        triggerLabel="Add question"
        placement="top"
        minMenuWidth={240}
        maxMenuHeight={480}
        options={[
          { value: "email", label: "Email", group: "Contact information" },
        ]}
        onChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add question" }));
    const menu = screen.getByRole("listbox", { name: "Personal information" });
    expect(container).not.toContainElement(menu);
    expect(menu).toHaveStyle({
      bottom: "406px",
      left: "776px",
      width: "240px",
      "max-height": "386px",
    });
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add question" })).toHaveFocus();
  });
  it("keeps default dropdown placement below when there is enough space", () => {
    vi.stubGlobal("innerHeight", 800);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 100,
      bottom: 140,
      left: 100,
      right: 300,
      width: 200,
      height: 40,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    });
    render(
      <CustomSelect
        label="Type"
        value="image"
        options={[{ value: "image", label: "Image" }]}
        onChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Image" }));
    expect(screen.getByRole("listbox")).toHaveStyle({
      top: "146px",
      maxHeight: "176px",
    });
  });
});

describe("CustomSelect country search", () => {
  it("opens with a typed prefix and supports search, arrows, selection and dismissal", () => {
    const onChange = vi.fn();
    render(
      <CustomSelect
        label="Country"
        ariaLabel="Country code"
        hideLabel
        searchable
        searchPlaceholder="Search countries"
        emptyLabel="No countries"
        value="964"
        triggerLabel="+964"
        options={[
          { value: "964", label: "Iraq (+964)", searchTerms: ["Iraq", "964"] },
          { value: "98", label: "Iran (+98)", searchTerms: ["Iran", "98"] },
          { value: "91", label: "India (+91)", searchTerms: ["India", "91"] },
          {
            value: "44",
            label: "United Kingdom (+44)",
            searchTerms: ["United Kingdom", "44"],
          },
        ]}
        onChange={onChange}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Country code" });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "i" });
    const search = screen.getByRole("searchbox", { name: "Search countries" });
    expect(search).toHaveFocus();
    expect(search).toHaveValue("i");
    expect(screen.getAllByRole("option")).toHaveLength(3);
    fireEvent.change(search, { target: { value: "ir" } });
    expect(screen.getAllByRole("option")).toHaveLength(2);
    fireEvent.keyDown(search, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: "Iraq (+964)" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    const iran = screen.getByRole("option", { name: "Iran (+98)" });
    expect(iran).toHaveFocus();
    fireEvent.click(iran);
    expect(onChange).toHaveBeenCalledWith("98");
    expect(trigger).toHaveFocus();
    fireEvent.click(trigger);
    const reopened = screen.getByRole("searchbox");
    fireEvent.change(reopened, { target: { value: "44" } });
    expect(screen.getAllByRole("option")).toHaveLength(1);
    fireEvent.keyDown(reopened, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("44");
    fireEvent.click(trigger);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "zz" },
    });
    expect(screen.getByRole("status")).toHaveTextContent("No countries");
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

function SelectInDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  useModalKeyboard({
    isOpen: true,
    dialogRef: dialog,
    onEscape: onClose,
    enterEnabled: false,
  });
  return (
    <div ref={dialog} role="dialog" tabIndex={-1}>
      <CustomSelect
        label="Type"
        value=""
        triggerLabel="Add question"
        options={[
          { value: "disabled", label: "Disabled", disabled: true },
          { value: "short", label: "Short answer" },
          { value: "choice", label: "Multiple choice" },
        ]}
        onChange={() => {}}
      />
    </div>
  );
}
it("navigates non-search menus and dismisses the menu before its parent editor", () => {
  const close = vi.fn();
  render(<SelectInDialog onClose={close} />);
  const trigger = screen.getByRole("button", { name: "Add question" });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  expect(screen.getByRole("option", { name: "Short answer" })).toHaveFocus();
  fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
  expect(screen.getByRole("option", { name: "Multiple choice" })).toHaveFocus();
  fireEvent.keyDown(document.activeElement!, { key: "Escape" });
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(close).not.toHaveBeenCalled();
  expect(trigger).toHaveFocus();
  fireEvent.keyDown(trigger, { key: "Escape" });
  expect(close).toHaveBeenCalledOnce();
});
