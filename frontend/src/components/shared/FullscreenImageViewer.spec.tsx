import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FullscreenImageViewer } from "./FullscreenImageViewer";

const labels = {
  close: "Close",
  previous: "Previous",
  next: "Next",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
};
const images = ["/first.png", "/second.png"];

describe("FullscreenImageViewer", () => {
  it("navigates the gallery and resets zoom when the image changes", () => {
    render(
      <FullscreenImageViewer
        images={images}
        initialIndex={1}
        title="Gallery"
        labels={labels}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute("src", images[1]);
    expect(screen.getByRole("button", { name: labels.zoomOut })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: labels.zoomIn }));
    expect(screen.getByRole("button", { name: labels.zoomOut })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: labels.next }));
    expect(screen.getByRole("img")).toHaveAttribute("src", images[0]);
    expect(screen.getByRole("button", { name: labels.zoomOut })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowLeft" });
    expect(screen.getByRole("img")).toHaveAttribute("src", images[1]);
  });
  it("keeps image clicks open, toggles zoom, and closes with backdrop, close or Escape", () => {
    const close = vi.fn();
    render(
      <FullscreenImageViewer
        images={[images[0]]}
        title="Photo"
        labels={labels}
        onClose={close}
      />,
    );
    expect(
      screen.queryByRole("button", { name: labels.next }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("img"));
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: labels.zoomOut })).toBeEnabled();
    fireEvent.click(screen.getByRole("img").parentElement!);
    expect(close).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: labels.close }));
    expect(close).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledTimes(3);
  });
});
