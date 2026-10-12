"use client";

import { Tooltip } from "./Tooltip";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
import styles from "./FullscreenImageViewer.module.css";

/** An unframed image canvas with native scrolling/pinch and explicit zoom controls. */
export function FullscreenImageViewer({
  images,
  initialIndex = 0,
  title,
  labels,
  onClose,
}: {
  images: string[];
  initialIndex?: number;
  title: string;
  labels: {
    close: string;
    previous: string;
    next: string;
    zoomIn: string;
    zoomOut: string;
  };
  onClose: () => void;
}) {
  const [index, setIndex] = useState(Math.min(initialIndex, images.length - 1));
  const [zoom, setZoom] = useState(1);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dragged = useRef(false);
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  useModalKeyboard({
    isOpen: true,
    dialogRef,
    initialFocusRef: closeRef,
    onEscape: onClose,
    enterEnabled: false,
  });
  const move = (direction: number) => {
    setIndex((value) => (value + direction + images.length) % images.length);
    setZoom(1);
    setNatural({ width: 0, height: 0 });
    stageRef.current?.scrollTo?.(0, 0);
  };
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () =>
      setViewport({ width: stage.clientWidth, height: stage.clientHeight });
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(stage);
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((value) =>
        Math.min(4, Math.max(1, value * (event.deltaY < 0 ? 1.15 : 1 / 1.15))),
      );
    };
    stage.addEventListener("wheel", wheel, { passive: false });
    return () => {
      observer?.disconnect();
      stage.removeEventListener("wheel", wheel);
    };
  }, []);
  const fit =
    natural.width && natural.height
      ? Math.min(
        1,
        Math.max(1, viewport.width - 32) / natural.width,
        Math.max(1, viewport.height - 32) / natural.height,
      )
      : 1;
  const width = natural.width * fit * zoom;
  const height = natural.height * fit * zoom;
  const buttonClass = styles.control;
  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      className={styles.viewer}
      dir="ltr"
      onKeyDown={(event) => {
        if (
          images.length > 1 &&
          (event.key === "ArrowLeft" || event.key === "ArrowRight")
        ) {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <div className={styles.toolbar}>
        <Tooltip content={labels.zoomOut}><button
          type="button"
          className={buttonClass}
          aria-label={labels.zoomOut}
          disabled={zoom <= 1}
          onClick={() => setZoom((value) => Math.max(1, value / 1.5))}
        >
          <ZoomOut aria-hidden />
        </button></Tooltip>
        <Tooltip content={labels.zoomIn}><button
          type="button"
          className={buttonClass}
          aria-label={labels.zoomIn}
          disabled={zoom >= 4}
          onClick={() => setZoom((value) => Math.min(4, value * 1.5))}
        >
          <ZoomIn aria-hidden />
        </button></Tooltip>
        <Tooltip content={labels.close}><button
          ref={closeRef}
          type="button"
          className={buttonClass}
          aria-label={labels.close}
          onClick={onClose}
        >
          <X aria-hidden />
        </button></Tooltip>
      </div>
      <div
        ref={stageRef}
        className={styles.stage}
        onClick={(event) => {
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          if (event.target instanceof HTMLImageElement)
            setZoom((value) => (value > 1 ? 1 : 2));
          else onClose();
        }}
        onPointerDown={(event) => {
          if (zoom <= 1 || event.pointerType !== "mouse" || event.button !== 0)
            return;
          dragged.current = false;
          const stage = event.currentTarget;
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            left: stage.scrollLeft,
            top: stage.scrollTop,
          };
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          if (
            Math.abs(event.clientX - drag.current.x) +
            Math.abs(event.clientY - drag.current.y) >
            4
          )
            dragged.current = true;
          event.currentTarget.scrollLeft =
            drag.current.left + drag.current.x - event.clientX;
          event.currentTarget.scrollTop =
            drag.current.top + drag.current.y - event.clientY;
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
      >
        <div
          className={styles.canvas}
          style={{
            width: width ? Math.max(viewport.width, width + 32) : "100%",
            height: height ? Math.max(viewport.height, height + 32) : "100%",
          }}
        >
          {/* Native intrinsic image dimensions are needed for the fit/zoom canvas. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={images[index]}
            src={images[index]}
            alt={title}
            draggable={false}
            className={styles.image}
            style={
              natural.width
                ? { width, height, cursor: zoom > 1 ? "grab" : "zoom-in" }
                : undefined
            }
            onLoad={(event) =>
              setNatural({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
          />
        </div>
      </div>
      {images.length > 1 && (
        <>
          <Tooltip content={labels.previous}><button
            type="button"
            className={`${buttonClass} ${styles.previous}`}
            aria-label={labels.previous}
            onClick={() => move(-1)}
          >
            <ChevronLeft aria-hidden />
          </button></Tooltip>
          <Tooltip content={labels.next}><button
            type="button"
            className={`${buttonClass} ${styles.next}`}
            aria-label={labels.next}
            onClick={() => move(1)}
          >
            <ChevronRight aria-hidden />
          </button></Tooltip>
        </>
      )}
    </div>,
    document.body,
  );
}
