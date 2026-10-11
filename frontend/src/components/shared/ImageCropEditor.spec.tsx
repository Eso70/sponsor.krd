import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageCropEditor } from "./ImageCropEditor";
import { imageCropCopy } from "./image-crop-copy";
import { exportImageCrop, loadCropImage } from "@/lib/images/image-crop";
import { readFileSync } from "node:fs";

vi.mock("@/lib/images/image-crop", async (original) => ({
  ...(await original<typeof import("@/lib/images/image-crop")>()),
  loadCropImage: vi.fn(),
  exportImageCrop: vi.fn(),
}));
const copy = imageCropCopy("en");
const src = "data:image/png;base64,YQ==";
const setup = (
  aspect: "original" | "square" | "wide" | undefined = "square",
) => {
  const onClose = vi.fn();
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  render(
    <ImageCropEditor
      src={src}
      aspect={aspect}
      maxEdge={aspect === "square" ? 720 : 1440}
      copy={copy}
      cancelLabel="Cancel"
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );
  return { onClose, onConfirm };
};

describe("shared image crop editor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const image = document.createElement("img");
    Object.defineProperties(image, {
      naturalWidth: { value: 1600 },
      naturalHeight: { value: 900 },
    });
    vi.mocked(loadCropImage).mockResolvedValue(image);
    vi.mocked(exportImageCrop).mockResolvedValue(
      new File(["raster"], "crop.png", { type: "image/png" }),
    );
    const context = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      drawImage: vi.fn(),
      getImageData: (
        _x: number,
        _y: number,
        width: number,
        height: number,
      ) => ({ data: new Uint8ClampedArray(width * height * 4) }),
      putImageData: vi.fn(),
      scale: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      strokeRect: vi.fn(),
      translate: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
  });
  afterEach(() => vi.restoreAllMocks());
  it("keeps guides on and opens the cropped preview in the shared viewer", async () => {
    const { onConfirm } = setup();
    const encode = vi
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue(src);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: copy.confirm })).toBeEnabled(),
    );
    expect(screen.queryByText("Show guides")).not.toBeInTheDocument();
    const canvas = screen.getByRole("img", {
      name: copy.hint,
    }) as HTMLCanvasElement;
    expect(canvas.getContext("2d")!.stroke).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: copy.preview }));
    const viewer = await screen.findByRole("dialog", { name: copy.preview });
    expect(viewer).toBeInTheDocument();
    expect(encode).toHaveBeenCalledWith("image/png");
    expect(
      within(viewer)
        .getByRole("img", { name: copy.preview, hidden: true })
        .getAttribute("src"),
    ).toBe(src);
    fireEvent.click(screen.getByRole("button", { name: copy.close }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(onConfirm).not.toHaveBeenCalled();
    expect(exportImageCrop).not.toHaveBeenCalled();
  });
  it("keeps actions in the supplied footer and replaces the slider with zoom buttons", async () => {
    const footer = document.createElement("div");
    document.body.append(footer);
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    try {
      render(
        <ImageCropEditor
          src={src}
          copy={copy}
          cancelLabel="Cancel"
          onClose={vi.fn()}
          onConfirm={onConfirm}
          footerTarget={footer}
        />,
      );
      const confirm = screen.getByRole("button", { name: copy.confirm });
      await waitFor(() => expect(confirm).toBeEnabled());
      expect(footer).toContainElement(confirm);
      expect(footer).toContainElement(
        screen.getByRole("button", { name: "Cancel" }),
      );
      expect(screen.queryByRole("slider")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: copy.zoomIn }));
      fireEvent.click(confirm);
      await waitFor(() => expect(onConfirm).toHaveBeenCalled());
      expect(vi.mocked(exportImageCrop).mock.calls[0][2].zoom).toBeCloseTo(1.1);
    } finally {
      footer.remove();
    }
  });
  it("overrides the global button cursor for every enabled crop edge", async () => {
    setup();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: copy.reset })).toBeEnabled(),
    );
    const css = readFileSync("src/app/globals.css", "utf8");
    const style = document.createElement("style");
    style.textContent = css.slice(
      css.indexOf("/* Crop handles resize"),
      css.indexOf(":where(:disabled, [aria-disabled"),
    );
    document.head.append(style);
    try {
      const rules = Array.from(style.sheet!.cssRules) as CSSStyleRule[];
      const cursors = [
        "nwse-resize",
        "ns-resize",
        "nesw-resize",
        "ew-resize",
        "nwse-resize",
        "ns-resize",
        "nesw-resize",
        "ew-resize",
      ];
      cursors.forEach((cursor, index) => {
        const handle = screen.getByRole("button", {
          name: `${copy.resize} ${index + 1}`,
        });
        const rule = rules.find((candidate) =>
          handle.matches(candidate.selectorText),
        );
        expect(rule?.style.getPropertyValue("cursor")).toBe(cursor);
        expect(rule?.style.getPropertyPriority("cursor")).toBe("important");
        handle.setAttribute("disabled", "");
        expect(
          rules.some((candidate) => handle.matches(candidate.selectorText)),
        ).toBe(false);
      });
    } finally {
      style.remove();
    }
  });
  it("defaults to free proportions containing the full source image", async () => {
    render(
      <ImageCropEditor
        src={src}
        copy={copy}
        cancelLabel="Cancel"
        onClose={vi.fn()}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: copy.confirm })).toBeEnabled(),
    );
    expect(screen.getByRole("button", { name: copy.title })).toHaveTextContent(
      copy.free,
    );
    fireEvent.click(screen.getByRole("button", { name: copy.confirm }));
    await waitFor(() =>
      expect(exportImageCrop).toHaveBeenCalledWith(
        expect.any(HTMLImageElement),
        16 / 9,
        { zoom: 1, x: 0, y: 0 },
        false,
        1440,
      ),
    );
  });
  it("supports zoom, reset, aspect changes and blurred fit before confirmation", async () => {
    const { onConfirm } = setup();
    const zoom = screen.getByRole("button", { name: copy.reset });
    await waitFor(() => expect(zoom).toBeEnabled());
    for (let i = 0; i < 10; i++)
      fireEvent.click(screen.getByRole("button", { name: copy.zoomIn }));
    expect(screen.getByRole("button", { name: copy.zoomOut })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: copy.reset }));
    expect(screen.getByRole("button", { name: copy.zoomOut })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: copy.title }));
    fireEvent.click(screen.getByRole("option", { name: copy.wide }));
    expect(screen.getByRole("button", { name: copy.title })).toHaveTextContent(
      copy.wide,
    );
    fireEvent.click(screen.getByRole("switch", { name: copy.blur }));
    fireEvent.click(screen.getByRole("button", { name: copy.zoomOut }));
    expect(screen.getByRole("button", { name: copy.zoomOut })).toBeDisabled(); // The image and wide crop already share a ratio.
    fireEvent.click(screen.getByRole("button", { name: copy.confirm }));
    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith(expect.any(File)),
    );
    expect(exportImageCrop).toHaveBeenCalledWith(
      expect.any(HTMLImageElement),
      16 / 9,
      { zoom: 1, x: 0, y: 0 },
      true,
      720,
    );
  });
  it("cancel never exports or changes the source", () => {
    const { onClose, onConfirm } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(exportImageCrop).not.toHaveBeenCalled();
  });
  it("allows keyboard panning and fits a landscape image with blur", async () => {
    setup();
    const zoom = screen.getByRole("button", { name: copy.reset });
    await waitFor(() => expect(zoom).toBeEnabled());
    fireEvent.keyDown(screen.getByRole("img", { name: copy.hint }), {
      key: "ArrowRight",
    });
    fireEvent.click(screen.getByRole("button", { name: copy.reset }));
    fireEvent.click(screen.getByRole("switch", { name: copy.blur }));
    for (let i = 0; i < 5; i++)
      fireEvent.click(screen.getByRole("button", { name: copy.zoomOut }));
    expect(screen.getByRole("button", { name: copy.zoomOut })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: copy.confirm }));
    await waitFor(() =>
      expect(exportImageCrop).toHaveBeenCalledWith(
        expect.any(HTMLImageElement),
        1,
        { zoom: 0.5625, x: 0, y: 0 },
        true,
        720,
      ),
    );
  });
  it("resizes free proportions manually without opening another dialog", async () => {
    setup();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: copy.reset })).toBeEnabled(),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: copy.title }));
    fireEvent.click(screen.getByRole("option", { name: copy.free }));
    const right = screen.getByRole("button", { name: `${copy.resize} 4` });
    expect(right).toHaveStyle({ cursor: "ew-resize", height: "352px" });
    expect(
      screen.getByRole("button", { name: `${copy.resize} 2` }),
    ).toHaveStyle({ cursor: "ns-resize", width: "352px" });
    expect(
      screen.getByRole("button", { name: `${copy.resize} 1` }),
    ).toHaveStyle({ cursor: "nwse-resize", zIndex: "20" });
    expect(
      screen.getByRole("button", { name: `${copy.resize} 3` }),
    ).toHaveStyle({ cursor: "nesw-resize", zIndex: "20" });
    fireEvent.keyDown(right, { key: "ArrowRight", shiftKey: true });
    fireEvent.click(screen.getByRole("button", { name: copy.confirm }));
    await waitFor(() => expect(exportImageCrop).toHaveBeenCalled());
    expect(vi.mocked(exportImageCrop).mock.calls[0][1]).toBeCloseTo(368 / 352);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("shows an inline error on decoding and encoding failures", async () => {
    vi.mocked(loadCropImage).mockRejectedValue(new Error("Decode failed"));
    const view = setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(copy.error);
    expect(screen.getByRole("button", { name: copy.confirm })).toBeDisabled();
    expect(view.onConfirm).not.toHaveBeenCalled();
  });
  it("does not close or save when export fails", async () => {
    const { onConfirm, onClose } = setup();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: copy.confirm })).toBeEnabled(),
    );
    vi.mocked(exportImageCrop).mockRejectedValue(new Error("Encode failed"));
    fireEvent.click(screen.getByRole("button", { name: copy.confirm }));
    expect(await screen.findByRole("alert")).toHaveTextContent(copy.error);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
