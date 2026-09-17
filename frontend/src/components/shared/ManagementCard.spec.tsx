import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ManagementCard } from "./ManagementCard";

describe("ManagementCard", () => {
  it("provides the shared management-grid card surface", () => {
    render(
      <ManagementCard intrinsicHeight={320}>Linktree record</ManagementCard>,
    );

    const card = screen.getByText("Linktree record");
    expect(card).toHaveClass("bg-white", "p-4", "dark:bg-[#1c222b]");
    expect(card).toHaveStyle({ containIntrinsicSize: "320px" });
  });
});
