import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ManagementDrawer } from "./ManagementDrawer";

vi.mock("motion/react", async (original) => {
  const motion = await original<typeof import("motion/react")>();
  return { ...motion, useReducedMotion: () => true };
});

describe("reduced-motion drawer", () => {
  it("opens and closes without moving the panel and still releases focus and scrolling", async () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    const { rerender } = render(
      <ManagementDrawer isOpen title="Accessible editor" onClose={vi.fn()}>
        Content
      </ManagementDrawer>,
    );
    const dialog = screen.getByRole("dialog", { name: "Accessible editor" });
    expect(dialog.style.transform).toBe("none");
    expect(dialog).toHaveFocus();
    rerender(
      <ManagementDrawer
        isOpen={false}
        title="Accessible editor"
        onClose={vi.fn()}
      >
        Content
      </ManagementDrawer>,
    );
    expect(dialog.style.transform).toBe("none");
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(document.body.style.overflow).not.toBe("hidden");
    await waitFor(() => expect(opener).toHaveFocus());
    opener.remove();
  });
});
