import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IconPicker } from "./IconPicker";
import { englishIconPickerCopy } from "@/features/link-editor/editor-copy";

vi.mock("@/lib/config/icons", () => ({
  CUSTOM_ICONS_MAP: { Link: () => <svg />, Heart: () => <svg /> },
  ICON_CATEGORIES: { all: ["Link", "Heart"], lucide: ["Link", "Heart"] },
}));

describe("IconPicker popup", () => {
  it.each(["light", "dark"])("inherits %s appearance, searches, selects and restores focus", async (appearance) => {
    const onChange = vi.fn();
    const { container } = render(
      <div className={appearance}>
        <IconPicker value="Link" onChange={onChange} copy={englishIconPickerCopy}
          customTrigger={<span>Platform icon</span>} />
      </div>,
    );
    await waitFor(() => expect(screen.getByRole("button", { name: "Choose icon" })).toHaveAttribute("aria-haspopup", "dialog"));
    const trigger = screen.getByRole("button", { name: "Choose icon" });
    fireEvent.click(trigger);
    const popup = await screen.findByRole("dialog", { name: "Choose an icon" });
    expect(container).not.toContainElement(popup);
    expect(popup).toHaveAttribute("aria-modal", "false");
    expect(popup.parentElement).toHaveClass(appearance);
    expect(popup).toHaveStyle({ width: "400px" });
    fireEvent.change(within(popup).getByPlaceholderText("Search icons"), { target: { value: "Heart" } });
    fireEvent.click(within(popup).getByRole("button", { name: "Heart" }));
    expect(onChange).toHaveBeenCalledWith("Heart");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("dismisses with outside pointer and Escape without changing the icon", async () => {
    const onChange = vi.fn();
    render(<IconPicker value="Link" onChange={onChange} copy={englishIconPickerCopy} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Choose icon" })).toHaveAttribute("aria-haspopup", "dialog"));
    fireEvent.click(screen.getByRole("button", { name: "Choose icon" }));
    await screen.findByRole("dialog");
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Choose icon" }));
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("changes libraries through a nested menu without dismissing the icon popup", async () => {
    render(<IconPicker value="Link" onChange={vi.fn()} copy={englishIconPickerCopy} />);
    fireEvent.click(screen.getByRole("button", { name: "Choose icon" }));
    const popup = await screen.findByRole("dialog", { name: "Choose an icon" });
    fireEvent.click(within(popup).getByRole("button", { name: "All" }));
    const menu = screen.getByRole("listbox", { name: "Icon library" });
    expect(popup).toContainElement(menu);
    const option = within(menu).getByRole("option", { name: "Lucide" });
    fireEvent.pointerDown(option);
    fireEvent.click(option);
    expect(screen.getByRole("dialog", { name: "Choose an icon" })).toBeInTheDocument();
    expect(within(popup).getByRole("button", { name: "Lucide" })).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

it("keeps icon selection inside the phone preview document", async () => {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  const doc = frame.contentDocument!;
  Object.defineProperty(frame.contentWindow!, "innerWidth", { value: 320, configurable: true });
  const change = vi.fn();
  const { unmount } = render(<IconPicker value="Link" onChange={change} copy={englishIconPickerCopy} />, { container: doc.body });
  const trigger = within(doc.body).getByRole("button", { name: "Choose icon" });
  fireEvent.click(trigger);
  const popup = await within(doc.body).findByRole("dialog");
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  await waitFor(() => expect(popup).toHaveStyle({ width: "296px" }));
  expect(doc.activeElement).toBe(within(popup).getByPlaceholderText("Search icons"));
  fireEvent.click(within(popup).getByRole("button", { name: "Heart" }));
  expect(change).toHaveBeenCalledWith("Heart");
  expect(doc.activeElement).toBe(trigger);
  unmount(); frame.remove();
});
