export interface AnchoredPopupPosition {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

/** Fixed popup bounds use the visible viewport, including an open mobile keyboard. */
export function anchoredPopupPosition({
  anchor,
  ownerWindow,
  width: preferredWidth,
  maxHeight = 540,
  gap = 8,
  margin = 12,
  alignRight = false,
  preferTop = false,
  preferredHeight = 320,
  container,
}: {
  anchor: DOMRect;
  ownerWindow: Window;
  width: number;
  maxHeight?: number;
  gap?: number;
  margin?: number;
  alignRight?: boolean;
  preferTop?: boolean;
  preferredHeight?: number;
  container?: DOMRect;
}): AnchoredPopupPosition {
  const viewport = ownerWindow.visualViewport;
  const viewportLeft = viewport?.offsetLeft ?? 0;
  const viewportTop = viewport?.offsetTop ?? 0;
  const viewportRight =
    viewportLeft + (viewport?.width ?? ownerWindow.innerWidth);
  const viewportBottom =
    viewportTop + (viewport?.height ?? ownerWindow.innerHeight);
  const leftBound = Math.max(
    viewportLeft + margin,
    container && container.width > 0 ? container.left + margin : 0,
  );
  const rightBound = Math.max(
    leftBound,
    Math.min(
      viewportRight - margin,
      container && container.width > 0
        ? container.right - margin
        : viewportRight - margin,
    ),
  );
  const topBound = viewportTop + margin;
  const bottomBound = Math.max(topBound, viewportBottom - margin);
  const width = Math.max(0, Math.min(preferredWidth, rightBound - leftBound));
  const below = Math.max(
    0,
    bottomBound - Math.max(topBound, anchor.bottom + gap),
  );
  const above = Math.max(0, Math.min(bottomBound, anchor.top - gap) - topBound);
  const opensAbove = preferTop
    ? above > 0 || below === 0
    : below < Math.min(preferredHeight, above);
  const height = Math.min(maxHeight, opensAbove ? above : below);
  const left = Math.max(
    leftBound,
    Math.min(
      alignRight ? anchor.right - width : anchor.left,
      rightBound - width,
    ),
  );
  return {
    left,
    width,
    maxHeight: height,
    ...(opensAbove
      ? {
          bottom:
            ownerWindow.innerHeight -
            Math.min(
              bottomBound,
              Math.max(topBound + height, anchor.top - gap),
            ),
        }
      : {
          top: Math.max(
            topBound,
            Math.min(anchor.bottom + gap, bottomBound - height),
          ),
        }),
  };
}
