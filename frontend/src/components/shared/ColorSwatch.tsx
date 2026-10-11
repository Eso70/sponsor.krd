import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { readableInk } from "@/lib/utils/parse-website-color";
import styles from "./ColorGradientModal.module.css";

/** Selected colors retain their complete fill instead of exposing the app accent. */
export function ColorSwatch({
  color,
  selected,
  onSelect,
}: {
  color: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={color}
      aria-pressed={selected}
      onClick={onSelect}
      className={styles.swatch}
      style={
        { "--picker-color": color, color: readableInk(color) } as CSSProperties
      }
    >
      {selected && <Check aria-hidden className="size-4" strokeWidth={2.5} />}
    </button>
  );
}
