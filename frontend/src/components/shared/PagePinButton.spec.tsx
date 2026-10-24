import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PagePinButton } from "./PagePinButton";
import { pageActionCopy } from "@/features/shared/i18n/page-action-copy";

describe.each(["en", "ar", "ckb"] as const)(
  "shared pin control (%s)",
  (locale) => {
    it("has an icon-only accessible toggle and does not open its parent card", () => {
      const toggle = vi.fn(),
        parent = vi.fn();
      const control = { toggle, pending: new Set<string>(), locale };
      const { rerender } = render(
        <div onClick={parent}>
          <PagePinButton id="page" control={control} />
        </div>,
      );
      const button = screen.getByRole("button", {
        name: pageActionCopy(locale).pin,
      });
      expect(button).toHaveAttribute("aria-pressed", "false");
      expect(button.textContent).toBe("");
      fireEvent.click(button);
      expect(toggle).toHaveBeenCalledWith("page", true);
      expect(parent).not.toHaveBeenCalled();
      rerender(
        <PagePinButton
          id="page"
          pinned
          control={{ ...control, pending: new Set(["page"]) }}
        />,
      );
      expect(
        screen.getByRole("button", { name: pageActionCopy(locale).unpin }),
      ).toBeDisabled();
    });
  },
);
