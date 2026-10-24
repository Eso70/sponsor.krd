import { render, screen } from "@testing-library/react";
import { useRef, type CSSProperties } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAnchoredPopup } from "./useAnchoredPopup";

const closePopup = vi.fn();

function Fixture({ direction = "ltr", align = "start", preferredWidth }: { direction?: "ltr" | "rtl"; align?: "start" | "end"; preferredWidth?: number }) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const style = useAnchoredPopup({ isOpen: true, anchorRef, popupRef, onClose: closePopup, align, preferredWidth });
  return <>
    <div role="dialog" data-testid="drawer">
      <button ref={anchorRef} style={{ direction, "--theme-primary": "#dc2626", "--theme-css": "linear-gradient(to right, #dc2626, #a21caf)", "--theme-ink": "#ffffff" } as CSSProperties}>Choose icon</button>
    </div>
    <div ref={popupRef} data-testid="popup" style={style} />
  </>;
}

function mockGeometry({ left = 823, top = 505, viewportWidth = 1919, viewportHeight = 943, drawerLeft = 768 }: {
  left?: number; top?: number; viewportWidth?: number; viewportHeight?: number; drawerLeft?: number;
} = {}) {
  vi.stubGlobal("innerWidth", viewportWidth);
  vi.stubGlobal("innerHeight", viewportHeight);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const isDrawer = this.dataset.testid === "drawer";
    const x = isDrawer ? drawerLeft : left;
    const y = isDrawer ? 0 : top;
    const width = isDrawer ? viewportWidth - drawerLeft : 40;
    const height = isDrawer ? viewportHeight : 40;
    return { left: x, right: x + width, top: y, bottom: y + height, width, height, x, y, toJSON: () => ({}) };
  });
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("useAnchoredPopup placement", () => {
  it("keeps compact editable pickers aligned with the beginning of their field", () => {
    mockGeometry();
    render(<Fixture preferredWidth={248} />);
    expect(screen.getByTestId("popup")).toHaveStyle({ left: "823px", top: "553px", width: "248px" });
  });
  it("end-aligns a color popup so it extends back over the editor instead of the preview", () => {
    mockGeometry({ left: 1400 });
    render(<Fixture align="end" />);
    const popup = screen.getByTestId("popup");
    expect(popup).toHaveStyle({ left: "1040px", top: "553px", width: "400px" });
    expect(popup.style.getPropertyValue("--theme-primary")).toBe("#dc2626");
    expect(popup.style.getPropertyValue("--theme-css")).toBe("linear-gradient(to right, #dc2626, #a21caf)");
    expect(popup.style.getPropertyValue("--theme-ink")).toBe("#ffffff");
  });
  it("opens below the icon inside the desktop drawer instead of over the dashboard", () => {
    mockGeometry();
    render(<Fixture />);
    expect(screen.getByTestId("popup")).toHaveStyle({ left: "823px", top: "553px", width: "400px" });
  });

  it("keeps RTL alignment inside the drawer", () => {
    mockGeometry();
    render(<Fixture direction="rtl" />);
    expect(screen.getByTestId("popup")).toHaveStyle({ left: "780px" });
  });

  it("opens above a low trigger and shifts away from the right edge", () => {
    mockGeometry({ left: 1860, top: 820 });
    render(<Fixture />);
    expect(screen.getByTestId("popup")).toHaveStyle({ left: "1507px", bottom: "131px", maxHeight: "540px" });
  });

  it("fits within a mobile drawer", () => {
    mockGeometry({ left: 20, top: 200, viewportWidth: 320, viewportHeight: 700, drawerLeft: 0 });
    render(<Fixture />);
    expect(screen.getByTestId("popup")).toHaveStyle({ left: "12px", width: "296px", top: "248px" });
  });
});
