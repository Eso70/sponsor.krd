import { fireEvent, render, screen } from "@testing-library/react";
import { Images } from "lucide-react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { EditorSection } from "./EditorSection";
import { editorSectionCopy } from "./editor-section-copy";

describe("shared editor section identity", () => {
  it.each(["en", "ar", "ckb"] as const)(
    "describes collapsed content without changing the toggle name (%s)",
    (locale) => {
      const details = editorSectionCopy(locale);
      const summary = details.count("images", 3);
      function Section() {
        const [open, setOpen] = useState(false);
        return (
          <EditorSection
            title="Banner"
            icon={Images}
            summary={summary}
            open={open}
            onToggle={() => setOpen(!open)}
          >
            <input aria-label="Image title" defaultValue="Saved title" />
          </EditorSection>
        );
      }
      render(<Section />);
      const toggle = screen.getByRole("button", {
        name: "Banner",
      });
      expect(toggle).toHaveAccessibleDescription(summary);
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(toggle.closest("section")).toHaveAttribute("data-open", "true");
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "New title" },
      });
      fireEvent.click(toggle);
      fireEvent.click(toggle);
      expect(screen.getByRole("textbox")).toHaveValue("New title");
    },
  );
  it("keeps enable, reorder and delete actions outside the expand button", () => {
    const toggle = vi.fn(),
      enable = vi.fn(),
      remove = vi.fn(),
      reorder = vi.fn();
    render(
      <EditorSection
        title="Banner"
        icon={Images}
        summary="2 images"
        open={false}
        onToggle={toggle}
        enabled
        onEnabled={enable}
        leading={<button onClick={reorder}>Reorder Banner</button>}
        actions={<button onClick={remove}>Delete Banner</button>}
      >
        <p>Details</p>
      </EditorSection>,
    );
    fireEvent.click(screen.getByRole("switch", { name: "Banner" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Banner" }));
    fireEvent.click(screen.getByRole("button", { name: "Reorder Banner" }));
    expect(enable).toHaveBeenCalledExactlyOnceWith(false);
    expect(remove).toHaveBeenCalledOnce();
    expect(reorder).toHaveBeenCalledOnce();
    expect(toggle).not.toHaveBeenCalled();
  });
});
