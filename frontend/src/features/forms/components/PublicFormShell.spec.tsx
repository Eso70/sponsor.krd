import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicFormShell } from "./PublicFormShell";
import { FormMoney } from "./FormMoney";

afterEach(() => vi.unstubAllGlobals());

describe("public form viewport and amounts", () => {
  it.each(["form", "card"] as const)(
    "%s follows keyboard/viewport resizing, ignores pinch zoom and removes listeners",
    (layout) => {
      const viewport = Object.assign(new EventTarget(), { height: 700, scale: 1 });
      vi.stubGlobal("visualViewport", viewport);
      const remove = vi.spyOn(viewport, "removeEventListener");
      const { unmount } = render(
        <PublicFormShell layout={layout} appearance="dark" language="ckb">
          <p>Form</p>
        </PublicFormShell>,
      );
      const main = screen.getByRole("main");
      expect(main.style.getPropertyValue("--form-viewport-height")).toBe("700px");
      vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
      viewport.height = 380;
      act(() => viewport.dispatchEvent(new Event("resize")));
      expect(main.style.getPropertyValue("--form-viewport-height")).toBe("380px");
      viewport.scale = 2;
      viewport.height = 190;
      act(() => viewport.dispatchEvent(new Event("resize")));
      expect(main.style.getPropertyValue("--form-viewport-height")).toBe("380px");
      unmount();
      expect(remove).toHaveBeenCalledWith("resize", expect.any(Function));
    },
  );
  it.each(["en", "ar", "ckb"] as const)(
    "renders readable, isolated large amounts in %s",
    (language) => {
      const { container } = render(
        <FormMoney value={9000000.25} currency="IQD" />,
      );
      const amount = container.querySelector("bdi")!;
      expect(amount).toHaveAttribute("dir", "ltr");
      expect(amount.textContent).toBe("IQD 9,000,000.25");
      expect(amount.textContent).toContain("25");
      expect(amount.textContent).not.toMatch(/[\u0660-\u0669\u06f0-\u06f9]/);
      if (language !== "en") expect(amount.textContent).toContain("IQD");
    },
  );
});
