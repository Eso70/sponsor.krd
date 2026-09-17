import { render, screen, waitFor } from "@testing-library/react";
import { ColorGradientModal } from "./ColorGradientModal";

describe("ColorGradientModal", () => {
  it("uses the active business theme for portal action controls", async () => {
    render(
      <ColorGradientModal
        isOpen
        value="gradient:to-r:#111111:#eeeeee"
        onChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(document.querySelector(".modal-ltr")).not.toBeNull();
    });

    const themedButtons = document.querySelectorAll<HTMLButtonElement>(
      ".modal-ltr button.theme-fill",
    );

    expect(themedButtons.length).toBeGreaterThanOrEqual(2);
    const activeDirection = screen.getByTitle("چەپ بۆ ڕاست");
    expect(activeDirection).toHaveClass("theme-fill");
    expect(activeDirection.style.borderColor).toBe("");
  });

  it("offers every supported linear and radial gradient direction", async () => {
    render(
      <ColorGradientModal
        isOpen
        value="gradient:to-r:#111111:#eeeeee"
        onChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(document.querySelector(".modal-ltr")).not.toBeNull();
    });

    [
      "چەپ بۆ ڕاست",
      "ڕاست بۆ چەپ",
      "سەرەوە بۆ خوارەوە",
      "خوارەوە بۆ سەرەوە",
      "لاتەنیشت",
      "لاتەنیشت پێچەوانە",
      "بۆ سەرەوەی ڕاست",
      "بۆ سەرەوەی چەپ",
      "بازنەیی",
    ].forEach((title) => {
      expect(screen.getByTitle(title)).toBeInTheDocument();
    });
  });
});
