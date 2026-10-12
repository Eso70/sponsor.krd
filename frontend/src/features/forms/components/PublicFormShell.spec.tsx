import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicFormShell } from "./PublicFormShell";
import { FormMoney } from "./FormMoney";

afterEach(() => vi.unstubAllGlobals());

describe("public form viewport and amounts", () => {
  it.each(["form", "card"] as const)(
    "%s follows keyboard/viewport resizing, ignores pinch zoom and removes listeners",
    (layout) => {
      const viewport = Object.assign(new EventTarget(), { height: 700, scale: 1, offsetTop: 0 });
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
      viewport.offsetTop = 220;
      act(() => viewport.dispatchEvent(new Event("scroll")));
      expect(main.style.getPropertyValue("--form-viewport-top")).toBe("220px");
      viewport.scale = 2;
      viewport.height = 190;
      viewport.offsetTop = 300;
      act(() => viewport.dispatchEvent(new Event("resize")));
      expect(main.style.getPropertyValue("--form-viewport-height")).toBe("380px");
      expect(main.style.getPropertyValue("--form-viewport-top")).toBe("220px");
      viewport.scale = 1;
      viewport.height = 700;
      viewport.offsetTop = 0;
      act(() => viewport.dispatchEvent(new Event("resize")));
      expect(main.style.getPropertyValue("--form-viewport-height")).toBe("700px");
      expect(main.style.getPropertyValue("--form-viewport-top")).toBe("0px");
      unmount();
      expect(remove).toHaveBeenCalledWith("resize", expect.any(Function));
      expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
    },
  );
  it.each(["form", "card"] as const)(
    "%s keeps the focused numeric field inside the content region during keyboard panning",
    (layout) => {
      const viewport = Object.assign(new EventTarget(), { height: 700, scale: 1, offsetTop: 0 });
      vi.stubGlobal("visualViewport", viewport);
      vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
      render(
        <PublicFormShell layout={layout}>
          <div role="region" aria-label="Questions"><input type="number" aria-label="Quantity" /></div>
          <footer>Send</footer>
        </PublicFormShell>,
      );
      const region = screen.getByRole("region", { name: "Questions" });
      const input = screen.getByRole("spinbutton", { name: "Quantity" });
      input.focus();
      vi.spyOn(region, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 120, 390, 230));
      vi.spyOn(input, "getBoundingClientRect").mockReturnValue(new DOMRect(20, 400, 200, 48));
      viewport.height = 380;
      viewport.offsetTop = 220;
      act(() => viewport.dispatchEvent(new Event("resize")));
      expect(region.scrollTop).toBe(110);
      expect(input).toHaveFocus();
      expect(screen.getByRole("main").style.getPropertyValue("--form-viewport-top")).toBe("220px");
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
