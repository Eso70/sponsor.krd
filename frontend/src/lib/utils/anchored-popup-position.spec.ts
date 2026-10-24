import { describe, expect, it } from "vitest";
import { anchoredPopupPosition } from "./anchored-popup-position";

function viewport(
  width: number,
  height: number,
  visual?: {
    width: number;
    height: number;
    offsetLeft: number;
    offsetTop: number;
  },
) {
  return {
    innerWidth: width,
    innerHeight: height,
    visualViewport: visual,
  } as Window;
}
function anchor(left: number, top: number, width = 80, height = 40) {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
  } as DOMRect;
}
describe("shared popup visible bounds", () => {
  it("fits narrow phones without imposing a desktop minimum width", () => {
    expect(
      anchoredPopupPosition({
        anchor: anchor(260, 200),
        ownerWindow: viewport(320, 640),
        width: 400,
      }),
    ).toMatchObject({ left: 12, width: 296, top: 248, maxHeight: 380 });
  });
  it("moves above the keyboard and respects a panned visual viewport", () => {
    const style = anchoredPopupPosition({
      anchor: anchor(280, 350),
      ownerWindow: viewport(390, 844, {
        width: 360,
        height: 300,
        offsetLeft: 15,
        offsetTop: 100,
      }),
      width: 400,
    });
    expect(style).toMatchObject({
      left: 27,
      width: 336,
      bottom: 502,
      maxHeight: 230,
    });
  });
  it("never forces 120px of content into a shorter landscape viewport", () => {
    const style = anchoredPopupPosition({
      anchor: anchor(20, 28, 80, 40),
      ownerWindow: viewport(600, 100),
      width: 400,
    });
    expect(style.maxHeight).toBe(12);
    expect(style.top).toBe(76);
  });
  it("keeps right-aligned tablet popups inside their drawer", () => {
    expect(
      anchoredPopupPosition({
        anchor: anchor(750, 100),
        ownerWindow: viewport(1024, 768),
        width: 400,
        alignRight: true,
        container: anchor(600, 0, 424, 768),
      }),
    ).toMatchObject({ left: 612, width: 400, top: 148 });
  });
});
