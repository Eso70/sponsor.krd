"use client";
import type { CropEdge, CropFrame } from "@/lib/images/crop-selection";

const handles: { edge: CropEdge; x: number; y: number; cursor: string }[] = [
  { edge: "nw", x: 0, y: 0, cursor: "nwse-resize" },
  { edge: "n", x: 0.5, y: 0, cursor: "ns-resize" },
  { edge: "ne", x: 1, y: 0, cursor: "nesw-resize" },
  { edge: "e", x: 1, y: 0.5, cursor: "ew-resize" },
  { edge: "se", x: 1, y: 1, cursor: "nwse-resize" },
  { edge: "s", x: 0.5, y: 1, cursor: "ns-resize" },
  { edge: "sw", x: 0, y: 1, cursor: "nesw-resize" },
  { edge: "w", x: 0, y: 0.5, cursor: "ew-resize" },
];
export function ImageCropHandles({
  frame,
  label,
  disabled,
  onStart,
  onMove,
  onEnd,
  onKeyResize,
}: {
  frame: CropFrame;
  label: string;
  disabled: boolean;
  onStart: (edge: CropEdge, x: number, y: number) => void;
  onMove: (x: number, y: number) => void;
  onEnd: () => void;
  onKeyResize: (edge: CropEdge, dx: number, dy: number) => void;
}) {
  return (
    <>
      {handles.map(({ edge, x, y, cursor }, index) => (
        <button
          type="button"
          key={edge}
          data-crop-edge={edge}
          aria-label={`${label} ${index + 1}`}
          disabled={disabled}
          className="absolute z-10 flex size-7 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          style={{
            left: frame.left + frame.width * x,
            top: frame.top + frame.height * y,
            width: edge === "n" || edge === "s" ? frame.width : 28,
            height: edge === "e" || edge === "w" ? frame.height : 28,
            zIndex: edge.length === 2 ? 20 : 10,
            cursor: disabled ? "default" : cursor,
          }}
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            onStart(edge, event.clientX, event.clientY);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              onMove(event.clientX, event.clientY);
          }}
          onPointerUp={onEnd}
          onPointerCancel={onEnd}
          onLostPointerCapture={onEnd}
          onKeyDown={(event) => {
            if (
              !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                event.key,
              )
            )
              return;
            event.preventDefault();
            const step = event.shiftKey ? 16 : 4;
            onKeyResize(
              edge,
              event.key === "ArrowLeft"
                ? -step
                : event.key === "ArrowRight"
                  ? step
                  : 0,
              event.key === "ArrowUp"
                ? -step
                : event.key === "ArrowDown"
                  ? step
                  : 0,
            );
          }}
        >
          <span
            aria-hidden
            className="size-2.5 rounded-sm border border-slate-700 bg-white shadow-sm"
          />
        </button>
      ))}
    </>
  );
}
