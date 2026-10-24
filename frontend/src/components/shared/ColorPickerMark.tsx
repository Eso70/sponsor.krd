import { Palette } from "lucide-react";
import { parseWebsiteColor, readableInk } from "@/lib/utils/parse-website-color";

/** Keep the button surface neutral while showing its selected solid/gradient color. */
export function ColorPickerMark({ value }: { value?: string }) {
  const color = value ? parseWebsiteColor(value) : null;
  return (
    <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-md"
      style={color ? { background: color.css, color: readableInk(color.primary) } : undefined}>
      <Palette className={color ? "size-3" : "size-4"} />
    </span>
  );
}
