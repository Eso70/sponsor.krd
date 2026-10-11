import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardAppearanceControls } from "./DashboardAppearanceControls";

describe.each([false, true])(
  "Dashboard appearance controls (compact=%s)",
  (compact) => {
    it("uses the controlled dashboard theme and the supplied language action", () => {
      const toggle = vi.fn();
      const language = vi.fn();
      const props = {
        compact,
        mounted: true,
        onToggleTheme: toggle,
        languageControl: <button onClick={language}>Language</button>,
      };
      const { rerender } = render(
        <DashboardAppearanceControls {...props} theme="light" />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
      expect(toggle).toHaveBeenCalledOnce();
      fireEvent.click(screen.getByRole("button", { name: "Language" }));
      expect(language).toHaveBeenCalledOnce();
      rerender(<DashboardAppearanceControls {...props} theme="dark" />);
      expect(
        screen
          .getByRole("button", { name: "Toggle theme" })
          .querySelector(".lucide-sun"),
      ).toBeInTheDocument();
    });
  },
);
