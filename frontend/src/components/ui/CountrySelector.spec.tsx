import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CountrySelector } from "./CountrySelector";

describe("CountrySelector popup", () => {
  it.each(["light", "dark"])("follows the public form's %s appearance independently of the dashboard", (appearance) => {
    render(<div className={appearance === "light" ? "dark" : "light"}>
      <div data-appearance={appearance}><CountrySelector value="964" onChange={vi.fn()} language="en" compact /></div>
    </div>);
    const trigger = screen.getByRole("button", { name: /\+964/ });
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox").parentElement).toHaveClass(appearance);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    expect(screen.getByRole("listbox").querySelector("input")).toHaveAttribute("placeholder", "Search countries");
    fireEvent.keyDown(screen.getByPlaceholderText("Search countries"), { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
  it.each([false, true])("searches and selects calling codes with compact=%s", (compact) => {
    const onChange = vi.fn();
    const { container } = render(<div className="dark"><CountrySelector
      value="964" onChange={onChange} compact={compact} language="en" /></div>);
    fireEvent.click(screen.getByRole("button", { name: /\+964/ }));
    const menu = screen.getByRole("listbox");
    expect(container).not.toContainElement(menu);
    expect(menu.parentElement).toHaveClass("dark");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Search countries"), { target: { value: "+44" } });
    fireEvent.click(screen.getByRole("option", { name: /\+44/ }));
    expect(onChange).toHaveBeenCalledWith("44");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
