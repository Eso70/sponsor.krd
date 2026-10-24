import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLatestRequest } from "./useLatestRequest";

describe("latest dashboard request", () => {
  it("invalidates older responses and pending work after unmount", () => {
    const { result, unmount } = renderHook(() => useLatestRequest());
    const older = result.current();
    const newer = result.current();
    expect(older()).toBe(false);
    expect(newer()).toBe(true);
    act(() => unmount());
    expect(newer()).toBe(false);
  });
});
