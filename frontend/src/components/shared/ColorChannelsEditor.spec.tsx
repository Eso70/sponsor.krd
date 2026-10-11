import { useRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ColorGradientModal } from "./ColorGradientModal";

const copy = {
  title: "Picker",
  color: "Color value",
  first: "First",
  second: "Second",
  apply: "Apply",
  red: "Red",
  green: "Green",
  blue: "Blue",
  hue: "Hue",
  saturation: "Saturation",
  lightness: "Lightness",
};
function Picker({
  variant,
  initial,
  onApply,
}: {
  variant: "modal" | "popup";
  initial: string;
  onApply: (color: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const anchor = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={anchor}>Anchor</button>
      <ColorGradientModal
        isOpen
        value={initial}
        anchorRef={variant === "popup" ? anchor : undefined}
        copy={copy}
        onClose={vi.fn()}
        onChange={(color) => {
          setValue(color);
          onApply(color);
        }}
      />
      <output>{value}</output>
    </>
  );
}

async function open(variant: "modal" | "popup", initial = "#123456") {
  const onApply = vi.fn();
  render(<Picker variant={variant} initial={initial} onApply={onApply} />);
  await screen.findByRole("dialog", { name: "Picker" });
  return onApply;
}

describe.each(["modal", "popup"] as const)(
  "Color channels in %s",
  (variant) => {
    it("shows RGB channel gradients and allows clearing, typing and clamping numbers", async () => {
      const onApply = await open(variant);
      fireEvent.click(screen.getByRole("button", { name: "rgb" }));
      expect(
        screen
          .getByRole("slider", { name: "Red" })
          .style.getPropertyValue("--channel-track"),
      ).toBe("linear-gradient(to right, #003456, #ff3456)");
      const red = screen.getByRole("spinbutton", { name: "Red" });
      fireEvent.change(red, { target: { value: "" } });
      expect(screen.getByRole("textbox", { name: "Color value" })).toHaveValue(
        "#123456",
      );
      fireEvent.blur(red);
      expect(red).toHaveValue(18);
      fireEvent.change(red, { target: { value: "255" } });
      expect(screen.getByRole("textbox", { name: "Color value" })).toHaveValue(
        "#ff3456",
      );
      fireEvent.change(red, { target: { value: "999" } });
      fireEvent.blur(red);
      expect(red).toHaveValue(255);
      fireEvent.change(red, { target: { value: "-20" } });
      fireEvent.blur(red);
      expect(red).toHaveValue(0);
      fireEvent.click(screen.getByRole("button", { name: "Apply" }));
      expect(onApply).toHaveBeenCalledWith("#003456");
    });

    it("preserves HSL hue and saturation while editing black, including the hue endpoint", async () => {
      const onApply = await open(variant, "#000000");
      fireEvent.click(screen.getByRole("button", { name: "hsl" }));
      fireEvent.change(screen.getByRole("slider", { name: "Hue" }), {
        target: { value: "120" },
      });
      fireEvent.change(screen.getByRole("slider", { name: "Saturation" }), {
        target: { value: "100" },
      });
      expect(screen.getByRole("slider", { name: "Hue" })).toHaveValue("120");
      expect(screen.getByRole("textbox", { name: "Color value" })).toHaveValue(
        "#000000",
      );
      fireEvent.change(screen.getByRole("slider", { name: "Lightness" }), {
        target: { value: "50" },
      });
      expect(screen.getByRole("textbox", { name: "Color value" })).toHaveValue(
        "#00ff00",
      );
      fireEvent.change(screen.getByRole("slider", { name: "Hue" }), {
        target: { value: "360" },
      });
      expect(screen.getByRole("spinbutton", { name: "Hue" })).toHaveValue(360);
      expect(screen.getByRole("slider", { name: "Hue" })).toHaveAttribute(
        "aria-valuetext",
        "360°",
      );
      fireEvent.click(screen.getByRole("button", { name: "Apply" }));
      expect(onApply).toHaveBeenCalledWith("#ff0000");
    });

    it("commits number fields on Enter without applying the picker and isolates gradient stops", async () => {
      const onApply = await open(variant, "gradient:to-r:#123456:#abcdef");
      fireEvent.click(screen.getByRole("button", { name: "rgb" }));
      const red = screen.getByRole("spinbutton", { name: "Red" });
      red.focus();
      fireEvent.change(red, { target: { value: "300" } });
      fireEvent.keyDown(red, { key: "Enter" });
      expect(red).toHaveValue(255);
      expect(onApply).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Second" }));
      expect(screen.getByRole("spinbutton", { name: "Red" })).toHaveValue(171);
      fireEvent.change(screen.getByRole("slider", { name: "Blue" }), {
        target: { value: "0" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Apply" }));
      expect(onApply).toHaveBeenCalledWith("gradient:to-r:#ff3456:#abcd00");
    });
  },
);
