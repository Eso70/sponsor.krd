import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { LinktreeAppearanceControls, LINKTREE_DARK_BACKGROUND } from "./LinktreeAppearanceControls";

function AppearanceHarness({ locale = "en", initialValue = "#ffffff", initialImage = null }: { locale?: BusinessLocale; initialValue?: string; initialImage?: string | null }) {
  const [value, setValue] = useState(initialValue);
  const [image, setImage] = useState(initialImage);
  return <>
    <LinktreeAppearanceControls locale={locale} value={value} onChange={setValue} imagePreview={image} onImageChange={vi.fn()} onImageRemove={() => setImage(null)} imageLabel="Background image" />
    <output data-testid="saved-color">{value}</output>
    <output data-testid="saved-image">{image}</output>
  </>;
}

describe("Linktree page appearance", () => {
  it.each([
    ["en", "Theme", "Light", "Dark", "Custom"],
    ["ar", "المظهر", "فاتح", "داكن", "مخصص"],
    ["ckb", "ڕووکار", "ڕووناک", "تاریک", "ئارەزوومەندانە"],
  ] as const)("offers the three page themes in %s", (locale, label, light, dark, custom) => {
    render(<AppearanceHarness locale={locale} />);
    expect(screen.getByRole("combobox", { name: label })).toHaveTextContent(light);
    expect(screen.queryByRole("button", { name: "Color" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("combobox", { name: label }));
    const menu = within(screen.getByRole("listbox", { name: label }));
    expect(menu.getAllByRole("option")).toHaveLength(3);
    expect(menu.getByRole("option", { name: custom })).toBeInTheDocument();
    fireEvent.click(menu.getByRole("option", { name: dark }));
    expect(screen.getByTestId("saved-color")).toHaveTextContent(LINKTREE_DARK_BACKGROUND);
  });

  it("preserves existing custom gradients and clears an image when choosing a preset", () => {
    const gradient = "gradient:to-r:#123456:#abcdef";
    render(<AppearanceHarness initialValue={gradient} initialImage="/images/upload/background.jpg" />);
    expect(screen.getByRole("combobox", { name: "Theme" })).toHaveTextContent("Custom");
    fireEvent.click(screen.getByRole("combobox", { name: "Theme" }));
    fireEvent.click(screen.getByRole("option", { name: "Light" }));
    expect(screen.getByTestId("saved-image")).toBeEmptyDOMElement();
    expect(screen.getByTestId("saved-color")).toHaveTextContent("#ffffff");
    fireEvent.click(screen.getByRole("combobox", { name: "Theme" }));
    fireEvent.click(screen.getByRole("option", { name: "Custom" }));
    expect(screen.getByTestId("saved-color")).toHaveTextContent(gradient);
    expect(screen.getByRole("combobox", { name: "Theme" })).toHaveTextContent("Custom");
  });

  it("opens the shared popup without preset swatches below the preview controls", async () => {
    render(<AppearanceHarness />);
    fireEvent.click(screen.getByRole("combobox", { name: "Theme" }));
    fireEvent.click(screen.getByRole("option", { name: "Custom" }));
    expect(screen.getByRole("combobox", { name: "Theme" })).toHaveTextContent("Custom");
    expect(screen.getByTestId("saved-color")).toHaveTextContent("#ffffff");
    const popup = await screen.findByRole("dialog", { name: "Custom background" });
    expect(popup).toHaveAttribute("aria-modal", "false");
    expect(screen.queryByRole("button", { name: "Red" })).not.toBeInTheDocument();
    fireEvent.click(within(popup).getByRole("button", { name: "Image" }));
    expect(within(popup).getByLabelText("Background image")).toBeInTheDocument();
    fireEvent.click(within(popup).getByRole("button", { name: "Apply" }));
    expect(screen.queryByRole("dialog", { name: "Custom background" })).not.toBeInTheDocument();
  });

  it("does not discard an uploaded image when applying the image tab", async () => {
    render(<AppearanceHarness initialValue="#abcdef" initialImage="/images/upload/background.jpg" />);
    fireEvent.click(screen.getByRole("combobox", { name: "Theme" }));
    fireEvent.click(screen.getByRole("option", { name: "Custom" }));
    const popup = await screen.findByRole("dialog", { name: "Custom background" });
    expect(within(popup).getByLabelText("Background image")).toBeInTheDocument();
    fireEvent.click(within(popup).getByRole("button", { name: "Apply" }));
    expect(screen.getByTestId("saved-image")).toHaveTextContent("/images/upload/background.jpg");
    expect(screen.getByTestId("saved-color")).toHaveTextContent("#abcdef");
  });
});
