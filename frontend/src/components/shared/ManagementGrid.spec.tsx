import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ManagementGrid } from "./ManagementGrid";

describe("ManagementGrid", () => {
  it("returns to the first page when a pin changes the collection order", () => {
    const items = [{ id: "one", name: "First" }, { id: "two", name: "Second" }];
    const props = { data: items, getItemKey: (item: typeof items[number]) => item.id, renderItem: (item: typeof items[number]) => <article>{item.name}</article> };
    const { rerender } = render(<ManagementGrid {...props} pagination={{ mode: "client", pageSize: 1, resetKey: 0 }} />);
    fireEvent.click(screen.getByRole("button", { name: /دواتر/ }));
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.queryByText("First")).not.toBeInTheDocument();
    rerender(<ManagementGrid {...props} pagination={{ mode: "client", pageSize: 1, resetKey: 1 }} />);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.queryByText("Second")).not.toBeInTheDocument();
  });
  it("renders a shared two-column management collection", () => {
    const { container } = render(
      <ManagementGrid
        data={[
          { id: "one", name: "First" },
          { id: "two", name: "Second" },
        ]}
        getItemKey={(item) => item.id}
        renderItem={(item) => <article>{item.name}</article>}
        desktopColumns={2}
      />,
    );

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(container.querySelector(".lg\\:grid-cols-2")).toBeInTheDocument();
    expect(container.querySelector(".xl\\:grid-cols-3")).toBeNull();
  });
});
