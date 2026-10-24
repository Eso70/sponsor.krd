import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LinktreeBusinessDetailsFields } from "./LinktreeBusinessDetailsFields";

describe("category changes and authored business details", () => {
  it("keeps incomplete hours editable after clearing the category", () => {
    const change = vi.fn();
    render(<LinktreeBusinessDetailsFields locale="en" onChange={change} errors={{ "business.hours": "invalid" }} seo={{ version: 1, business: { hours: { days: [], opens: "", closes: "" } } }} />);
    expect(screen.getByRole("switch", { name: "Opening hours" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Opens")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: "Opening hours" }));
    expect(change).toHaveBeenCalledWith({ version: 1, business: { hours: undefined } });
  });
  it("keeps existing details editable when changing to a personal category", () => {
    render(<LinktreeBusinessDetailsFields locale="en" onChange={vi.fn()} errors={{}} seo={{ version: 1, category: "personal", business: { city: "Erbil", cuisine: "Authored cuisine" } }} />);
    expect(screen.getByRole("textbox", { name: "City" })).toHaveValue("Erbil");
    expect(screen.getByRole("textbox", { name: "Cuisine" })).toHaveValue("Authored cuisine");
    expect(screen.queryByRole("textbox", { name: "Street address" })).not.toBeInTheDocument();
  });
});
