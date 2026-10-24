import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createForm } from "../forms-model";
import { formEditorCopy } from "../form-editor-copy";
import { FormPreview } from "./FormPreview";
import styles from "./FormPreview.module.css";
import { readFileSync } from "node:fs";
import { createFormTemplateFixture } from "@/features/templates/form-template-fixture";

describe("form device preview", () => {
  it.each(["form", "card"] as const)("preserves %s preview direction when languages change inside dashboard and drawer chrome", (layout) => {
    const globals = readFileSync("src/app/globals.css", "utf8");
    const chromeRules = globals.slice(globals.indexOf("/* Standard modal direction/layout contract."), globals.indexOf("@theme inline"));
    const stylesheet = document.createElement("style");
    stylesheet.textContent = chromeRules;
    document.head.append(stylesheet);
    try {
      const view = render(<div className="dashboard-ltr"><div className="modal-ltr"><FormPreview form={{ ...createForm("en"), layout }} /></div></div>);
      for (const language of ["ckb", "ar", "en"] as const) {
        for (const viewport of ["embedded", "device"] as const) {
          // The device fixture is the same source used by the Templates page.
          const form = { ...createFormTemplateFixture(language), layout };
          view.rerender(<div className="dashboard-ltr"><div className="modal-ltr"><FormPreview form={form} language={language} viewport={viewport} /></div></div>);
          const surface = view.container.querySelector<HTMLElement>("[data-form-preview]")!;
          expect(surface).toHaveAttribute("dir", language === "en" ? "ltr" : "rtl");
          expect(surface).toHaveAttribute("lang", language);
          for (const rule of Array.from(stylesheet.sheet!.cssRules) as CSSStyleRule[]) {
            for (const element of [surface, ...Array.from(surface.querySelectorAll("*"))]) {
              expect(element.matches(rule.selectorText)).toBe(false);
            }
          }
          expect(getComputedStyle(view.container.querySelector(".modal-ltr")!).direction).toBe("ltr");
          const previewDirection = surface.dir;
          view.rerender(<FormPreview form={form} presentation="public" />);
          expect(view.container.querySelector("[data-form-preview]")).toHaveAttribute("dir", previewDirection);
        }
      }
    } finally {
      stylesheet.remove();
    }
  });
  for (const layout of ["form", "card"] as const) {
    it.each(["light", "dark"] as const)(`${layout} fills the phone in %s without public-page behavior`, (appearance) => {
      const form = { ...createForm("en"), layout, appearance };
      const original = structuredClone(form);
      const { container } = render(<FormPreview form={form} placeholders viewport="device" />);
      const surface = container.querySelector("[data-form-preview]")!;
      expect(surface).toHaveAttribute("data-form-presentation", "preview");
      expect(surface).toHaveAttribute("data-form-viewport", "device");
      expect(surface).toHaveAttribute("data-appearance", appearance);
      expect(surface).toHaveClass(styles.publicSurface, styles.deviceSurface);
      expect(surface.parentElement).not.toHaveClass("max-w-sm");
      expect(screen.queryByRole("navigation", { name: formEditorCopy("en").previewPages })).not.toBeInTheDocument();
      expect(form).toEqual(original);
      expect(form.description).toBe("");
    });
  }

  it("preserves the compact layout and browsing controls in the editor", () => {
    const { container } = render(<FormPreview form={createForm("en")} placeholders />);
    const surface = container.querySelector("[data-form-preview]")!;
    expect(surface).not.toHaveClass(styles.publicSurface, styles.deviceSurface);
    expect(surface.parentElement).toHaveClass("max-w-sm");
    expect(screen.getByRole("navigation", { name: formEditorCopy("en").previewPages })).toBeInTheDocument();
  });
});
