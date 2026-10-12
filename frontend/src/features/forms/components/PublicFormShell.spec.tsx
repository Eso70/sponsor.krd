import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicFormShell } from "./PublicFormShell";
import { FormMoney } from "./FormMoney";

afterEach(() => vi.unstubAllGlobals());

describe("public form viewport and amounts", () => {
  it.each(["form", "card"] as const)(
    "%s leaves keyboard positioning to the browser",
    (layout) => {
      const viewport = Object.assign(new EventTarget(), { height: 380, scale: 1, offsetTop: 220 });
      vi.stubGlobal("visualViewport", viewport);
      const add = vi.spyOn(viewport, "addEventListener");
      render(
        <PublicFormShell layout={layout} appearance="dark" language="ckb">
          <input type="tel" aria-label="Phone" />
          <footer>Send</footer>
        </PublicFormShell>,
      );
      const main = screen.getByRole("main");
      screen.getByRole("textbox", { name: "Phone" }).focus();
      act(() => viewport.dispatchEvent(new Event("resize")));
      act(() => viewport.dispatchEvent(new Event("scroll")));
      expect(main).not.toHaveAttribute("style");
      expect(add).not.toHaveBeenCalled();
      expect(screen.getByRole("textbox", { name: "Phone" })).toHaveFocus();
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
