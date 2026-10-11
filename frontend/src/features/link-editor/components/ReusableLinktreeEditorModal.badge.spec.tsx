import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReusableLinktreeEditorModal } from "./ReusableLinktreeEditorModal";
import { englishEditorCopy } from "../editor-copy";

vi.mock("@/lib/contexts/ThemeProvider", () => ({ useTheme: () => ({ color: "#25F4EE" }) }));

describe("verification badge editor integration", () => {
  it.each([false, true])("defaults off and restores saved state with platformTheme=%s", (platformTheme) => {
    const props = { isOpen: true, onClose: vi.fn(), onSubmit: vi.fn(), platformTheme,
      copy: englishEditorCopy,
      ...(platformTheme ? { apiEndpoints: { upload: "/api/platform/linktrees/upload",
        checkName: "/api/platform/linktrees/check-name", checkSlug: "/api/platform/linktrees/check-slug" } } : {}) };
    const { rerender } = render(<ReusableLinktreeEditorModal {...props} />);
    const label = "Show blue verification badge";
    expect(screen.getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(screen.getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
    rerender(<ReusableLinktreeEditorModal {...props} isOpen={false} />);
    rerender(<ReusableLinktreeEditorModal {...props} editData={{ linktree: {
      id: "saved-page", name: "Saved page", uid: "saved-page", background_color: "#ffffff",
      template_config: { templateKey: "spectrum", verification_badge: true },
    }, links: [] }} />);
    expect(screen.getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(screen.getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "false");
  });
});
