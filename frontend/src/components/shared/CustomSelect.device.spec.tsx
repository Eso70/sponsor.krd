import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CustomSelect } from "./CustomSelect";

describe("selects in device previews", () => {
  it("keeps placement, focus, keyboard and outside dismissal in the trigger's document", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const doc = frame.contentDocument!;
    Object.defineProperty(frame.contentWindow!, "innerWidth", { value: 390, configurable: true });
    Object.defineProperty(frame.contentWindow!, "innerHeight", { value: 858, configurable: true });
    const change = vi.fn();
    const { unmount } = render(<CustomSelect label="Country" value="964" searchable
      minMenuWidth={340} onChange={change} options={[{ value: "964", label: "Iraq" }, { value: "44", label: "United Kingdom" }]} />, { container: doc.body });
    const trigger = within(doc.body).getByRole("button", { name: "Iraq" });
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({ left: 20, right: 90, top: 200, bottom: 240, width: 70, height: 40, x: 20, y: 200, toJSON: () => ({}) });
    fireEvent.click(trigger);
    const menu = within(doc.body).getByRole("listbox", { name: "Country" });
    expect(menu.ownerDocument).toBe(doc);
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(menu).toHaveStyle({ left: "20px", top: "246px", width: "340px" });
    expect(doc.activeElement).toBe(within(menu).getByRole("searchbox"));
    fireEvent.keyDown(doc, { key: "Escape" });
    expect(within(doc.body).queryByRole("listbox")).toBeNull();
    expect(doc.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    fireEvent.click(within(doc.body).getByRole("option", { name: "United Kingdom" }));
    expect(change).toHaveBeenCalledWith("44");
    fireEvent.click(trigger);
    fireEvent.mouseDown(doc.body);
    expect(within(doc.body).queryByRole("listbox")).toBeNull();
    unmount();
    frame.remove();
  });
});
