import {
  parseWebsiteColor,
  readableInk,
} from "@/lib/utils/parse-website-color";

/** Retain the brand hue while keeping selected navigation readable in white. */
export function sidebarSelectionColor(accentColor?: string | null): string {
  let { primary } = parseWebsiteColor(accentColor || "#64748b");
  if (primary.length === 4) {
    primary = `#${primary
      .slice(1)
      .split("")
      .map((digit) => digit + digit)
      .join("")}`;
  }
  while (readableInk(primary) !== "#ffffff") {
    primary = `#${[1, 3, 5]
      .map((offset) =>
        Math.floor(parseInt(primary.slice(offset, offset + 2), 16) * 0.9)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  }
  return primary;
}
