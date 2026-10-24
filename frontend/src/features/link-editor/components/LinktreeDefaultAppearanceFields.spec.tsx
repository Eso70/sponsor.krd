import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import type { BackgroundPatternStyle } from "@linktree/types";
import { LinktreeDefaultAppearanceFields } from "./LinktreeDefaultAppearanceFields";
vi.mock("@/hooks/useTemplateAccess", () => ({ useTemplateAccess: () => ({isTemplateAllowed: () => true}) }));
vi.mock("@/lib/contexts/ThemeProvider", () => ({useTheme: () => ({color: {raw: "#784fe3"}})}));

function SettingsFixture() {
  const [color, setColor] = useState("#161b22");
  const [pattern, setPattern] = useState<BackgroundPatternStyle>("grid45");
  return <LinktreeDefaultAppearanceFields locale="en" template="spectrum" color={color} pattern={pattern}
    onTemplateChange={vi.fn()} onColorChange={setColor} onPatternChange={setPattern} />;
}
describe("new-page appearance settings controls", () => {
  it("uses the shared theme selector and pattern popup", async () => {
    render(<SettingsFixture />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", {name: "Light"}));
    expect(screen.getByRole("combobox")).toHaveTextContent("Light");
    fireEvent.click(screen.getByRole("button", {name: /background pattern/i}));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", {name: "Dots"}));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", {name: /background pattern/i})).toHaveTextContent("Dots");
  });
});
