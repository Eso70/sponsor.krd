import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ColorGradientModal } from "./ColorGradientModal";

const colors = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ffffff",
  "#000000",
];
const copy = {
  title: "Color",
  solid: "Solid",
  gradient: "Gradient",
  first: "First",
  second: "Second",
  apply: "Apply",
};

describe.each(["modal", "popup"] as const)("Color picker %s", (variant) => {
  it("fills every preset with its own color and keeps selection inside the swatch", async () => {
    const anchor = document.createElement("button");
    document.body.append(anchor);
    const onChange = vi.fn();
    render(
      <ColorGradientModal
        isOpen
        value="#123456"
        copy={copy}
        onChange={onChange}
        onClose={vi.fn()}
        anchorRef={variant === "popup" ? { current: anchor } : undefined}
      />,
    );
    const dialog = await screen.findByRole("dialog", { name: "Color" });
    if (variant === "popup") {
      await waitFor(() => expect(dialog.style.width).toBe("400px"));
      expect(parseFloat(dialog.style.maxHeight)).toBeLessThanOrEqual(540);
    }
    expect(
      screen.queryByRole("button", { name: "#0f172a" }),
    ).not.toBeInTheDocument();
    for (const color of colors) {
      const swatch = screen.getByRole("button", { name: color });
      fireEvent.click(swatch);
      expect(swatch).toHaveAttribute("aria-pressed", "true");
      expect(swatch).not.toHaveClass("theme-fill");
      expect(swatch.style.getPropertyValue("--picker-color")).toBe(color);
      expect(swatch.querySelector("svg")).toBeInTheDocument();
      expect(
        dialog.querySelectorAll('[aria-pressed="true"][aria-label^="#"]'),
      ).toHaveLength(1);
      fireEvent.click(screen.getByRole("button", { name: "Apply" }));
      expect(onChange).toHaveBeenLastCalledWith(color);
    }
    anchor.remove();
  });

  it("removes the old gradient when switching to a solid or matching stops", async () => {
    const onChange = vi.fn();
    render(
      <ColorGradientModal
        isOpen
        value="gradient:to-b:#000000:#3b82f6"
        copy={copy}
        onChange={onChange}
        onClose={vi.fn()}
      />,
    );
    await screen.findByRole("dialog", { name: "Color" });
    const preview = document.querySelector<HTMLElement>(
      "[data-color-preview]",
    )!;
    expect(preview.style.getPropertyValue("--picker-color")).toContain(
      "linear-gradient",
    );
    fireEvent.click(screen.getByRole("button", { name: "Second" }));
    fireEvent.click(screen.getByRole("button", { name: "#000000" }));
    expect(preview.style.getPropertyValue("--picker-color")).toBe("#000000");
    fireEvent.click(screen.getByRole("button", { name: "Solid" }));
    expect(preview.style.getPropertyValue("--picker-color")).toBe("#000000");
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onChange).toHaveBeenCalledWith("#000000");
  });
});
