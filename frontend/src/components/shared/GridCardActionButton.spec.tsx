import { fireEvent, render, screen } from "@testing-library/react";
import { ExternalLink } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { GridCardActionButton } from "./GridCardActionButton";

describe("shared grid-card actions", () => {
  it("preserves dashboard button actions", () => {
    const action = vi.fn();
    render(<GridCardActionButton label="Edit" icon={ExternalLink} tone="neutral" onClick={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(action).toHaveBeenCalledOnce();
  });
  it("uses same-tab public links with keyboard accessibility", () => {
    render(<GridCardActionButton label="Open page" icon={ExternalLink} tone="neutral" href="/linktree/example" />);
    expect(screen.getByRole("link", { name: "Open page" })).toHaveAttribute("href", "/linktree/example");
    expect(screen.getByRole("link", { name: "Open page" })).not.toHaveAttribute("target");
  });
});
