import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { DashboardRefreshRegion } from "./DashboardRefreshRegion";

function Draft() {
  const [text, setText] = useState("");
  return <input aria-label="Draft" value={text} onChange={(event) => setText(event.target.value)} />;
}

describe("shared dashboard refresh content", () => {
  it("shows accessible progress and preserves mounted draft state across refresh", () => {
    const view = render(<DashboardRefreshRegion loading={false} label="Refreshing"><Draft /></DashboardRefreshRegion>);
    const input = screen.getByRole("textbox", { name: "Draft" });
    fireEvent.change(input, { target: { value: "Unsaved text" } });
    view.rerender(<DashboardRefreshRegion loading label="Refreshing"><Draft /></DashboardRefreshRegion>);
    expect(screen.getByRole("status")).toHaveTextContent("Refreshing");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    view.rerender(<DashboardRefreshRegion loading={false} label="Refreshing"><Draft /></DashboardRefreshRegion>);
    expect(screen.getByRole("textbox")).toBe(input);
    expect(input).toHaveValue("Unsaved text");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
