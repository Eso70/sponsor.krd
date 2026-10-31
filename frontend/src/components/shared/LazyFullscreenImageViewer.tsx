"use client";

import dynamic from "next/dynamic";

/** Download zoom and modal behavior only when a visitor opens an image. */
export const FullscreenImageViewer = dynamic(() =>
  import("./FullscreenImageViewer").then((module) => module.FullscreenImageViewer),
);
