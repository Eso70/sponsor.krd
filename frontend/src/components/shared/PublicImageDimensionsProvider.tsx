"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PublicImageDimensions } from "@linktree/types";

const ImageDimensionsContext = createContext<PublicImageDimensions>({});

export function PublicImageDimensionsProvider({
  dimensions = {},
  children,
}: {
  dimensions?: PublicImageDimensions;
  children: ReactNode;
}) {
  return (
    <ImageDimensionsContext.Provider value={dimensions}>
      {children}
    </ImageDimensionsContext.Provider>
  );
}

export function usePublicImageDimensions() {
  return useContext(ImageDimensionsContext);
}
