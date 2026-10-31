import { describe, expect, it } from "vitest";
import { formatTimeValue } from "./time-of-day";

describe("shared time display", () => {
  it.each([
    ["00:00", "12:00 AM"], ["01:00", "01:00 AM"], ["12:00", "12:00 PM"],
    ["13:05", "01:05 PM"], ["23:59", "11:59 PM"],
  ])("formats %s consistently for the drawer and public page", (value, expected) => {
    expect(formatTimeValue(value)).toBe(expected);
    expect(formatTimeValue(value, "24h")).toBe(value);
  });

  it.each(["", "24:00", "10:60", "invalid"])("does not display invalid time %s", value => {
    expect(formatTimeValue(value)).toBe("");
  });
});
