import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ManagementGrid } from "./ManagementGrid";

describe("ManagementGrid", () => {
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
