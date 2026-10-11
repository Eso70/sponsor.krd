"use client";

import { useState } from "react";
import {
  hexToHsl,
  hexToRgb,
  hslToHex,
  rgbToHex,
} from "@/lib/utils/color-conversion";
import { ColorChannelSlider } from "./ColorChannelSlider";

type ChannelLabels = Record<
  "red" | "green" | "blue" | "hue" | "saturation" | "lightness",
  string
>;

/** One RGB/HSL implementation shared by the modal and its anchored popup. */
export function ColorChannelsEditor({
  mode,
  value,
  onChange,
  labels,
}: {
  mode: "rgb" | "hsl";
  value: string;
  onChange: (color: string) => void;
  labels: ChannelLabels;
}) {
  // Retain hue/saturation even when black, white or gray cannot encode them in HEX.
  const [lastHsl, setLastHsl] = useState({
    hex: value,
    channels: hexToHsl(value),
  });
  const hsl = lastHsl.hex === value ? lastHsl.channels : hexToHsl(value);
  const rgb = hexToRgb(value);
  return (
    <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 dark:border-white/10 dark:bg-[#161b22]">
      {mode === "rgb"
        ? (["r", "g", "b"] as const).map((channel) => {
            const from = { ...rgb, [channel]: 0 };
            const to = { ...rgb, [channel]: 255 };
            const key =
              channel === "r" ? "red" : channel === "g" ? "green" : "blue";
            return (
              <ColorChannelSlider
                key={channel}
                label={labels[key]}
                value={rgb[channel]}
                max={255}
                color={value}
                track={`linear-gradient(to right, ${rgbToHex(from.r, from.g, from.b)}, ${rgbToHex(to.r, to.g, to.b)})`}
                onChange={(next) => {
                  const channels = { ...rgb, [channel]: next };
                  onChange(rgbToHex(channels.r, channels.g, channels.b));
                }}
              />
            );
          })
        : (["h", "s", "l"] as const).map((channel) => {
            const key =
              channel === "h"
                ? "hue"
                : channel === "s"
                  ? "saturation"
                  : "lightness";
            const track =
              channel === "h"
                ? "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)"
                : channel === "s"
                  ? `linear-gradient(to right, ${hslToHex(hsl.h, 0, hsl.l)}, ${hslToHex(hsl.h, 100, hsl.l)})`
                  : `linear-gradient(to right, #000000, ${hslToHex(hsl.h, hsl.s, 50)}, #ffffff)`;
            return (
              <ColorChannelSlider
                key={channel}
                label={labels[key]}
                value={hsl[channel]}
                max={channel === "h" ? 360 : 100}
                unit={channel === "h" ? "°" : "%"}
                track={track}
                color={value}
                onChange={(next) => {
                  const channels = { ...hsl, [channel]: next };
                  const hex = hslToHex(channels.h, channels.s, channels.l);
                  setLastHsl({ hex, channels });
                  onChange(hex);
                }}
              />
            );
          })}
    </div>
  );
}
