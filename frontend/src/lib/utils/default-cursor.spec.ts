import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createDefaultCursor, createPointerCursor, createCursorVariables } from "./default-cursor";

describe("theme-colored default cursor", () => {
  it.each(["#8754df", "#00b4cc", "#123"])("uses a white arrow and %s outline with the original geometry", (accent) => {
    const cursor = createDefaultCursor(accent);
    const encoded = cursor.match(/data:image\/svg\+xml,([^"]+)/)![1];
    const svg = new DOMParser().parseFromString(decodeURIComponent(encoded), "image/svg+xml");
    const original = new DOMParser().parseFromString(readFileSync("public/cursors/default.svg", "utf8"), "image/svg+xml");
    expect(svg.querySelector("path")?.getAttribute("fill")).toBe("#FFFFFF");
    expect(svg.querySelector("path")?.getAttribute("stroke")).toBe(accent);
    expect(svg.querySelector("feDropShadow")?.getAttribute("flood-color")).toBe(accent);
    expect(svg.querySelector("path")?.getAttribute("filter")).toBe("url(#cursor-glow)");
    expect(svg.querySelector("path")?.getAttribute("d")).toBe(original.querySelector("path")!.getAttribute("d"));
    expect(cursor).toContain('4 3, url("/cursors/default.svg") 4 3, default');
  });
  it("never interpolates arbitrary SVG or CSS into the cursor", () => {
    const value = decodeURIComponent(createDefaultCursor('"><script>alert(1)</script>'));
    expect(value).toContain('stroke="#64748b"');
    expect(value).not.toContain("<script>");
  });
  it.each(["#8754df", "#00b4cc"])("shares %s with the white pointer and motion halo", (accent) => {
    const variables = createCursorVariables(accent);
    expect(variables["--app-cursor-accent"]).toBe(accent);
    expect(variables["--app-pointer-cursor"]).toBe(createPointerCursor(accent));
    const value = createPointerCursor(accent);
    const svg = new DOMParser().parseFromString(decodeURIComponent(value.match(/data:image\/svg\+xml,([^"]+)/)![1]), "image/svg+xml");
    const fallback = new DOMParser().parseFromString(readFileSync("public/cursors/pointer.svg", "utf8"), "image/svg+xml");
    expect(svg.querySelector("path")?.getAttribute("fill")).toBe("#FFFFFF");
    expect(svg.querySelector("path")?.getAttribute("stroke")).toBe(accent);
    expect(svg.querySelector("path")?.getAttribute("d")).toBe(fallback.querySelector("path")?.getAttribute("d"));
    expect(value).toContain('10 3, url("/cursors/pointer.svg") 10 3, pointer');
    expect(createCursorVariables("red; color: black")["--app-cursor-accent"]).toBe("#64748b");
  });
});
