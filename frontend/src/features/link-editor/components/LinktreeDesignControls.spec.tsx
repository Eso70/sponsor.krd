import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LinktreeDesignControls } from "./LinktreeDesignControls";
import { englishEditorCopy } from "../editor-copy";

describe("preview design controls", () => {
  it("reuses the existing entitled template and pattern pickers", async () => {
    const template = vi.fn();
    const pattern = vi.fn();
    render(<LinktreeDesignControls locale="en" copy={englishEditorCopy} templateKey="spectrum"
      backgroundPattern="none" onTemplateChange={template} onPatternChange={pattern} allowedTemplateKeys={["spectrum", "aurora"]} />);
    fireEvent.click(screen.getByRole("button", { name: "Page design" }));
    expect(await screen.findByRole("dialog")).toHaveAttribute("aria-modal", "false");
    expect(screen.getByRole("button", { name: "Frost" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Aurora" }));
    expect(template).toHaveBeenCalledWith("aurora");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Background pattern" }));
    expect(await screen.findByRole("dialog")).toHaveAttribute("aria-modal", "false");
    fireEvent.click(screen.getByRole("radio", { name: "Dots" }));
    expect(pattern).toHaveBeenCalledWith("dots");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
