"use client";

import { PhoneMockup, type PhoneMockupProps } from "./PhoneMockup";
import { cn } from "@/lib/utils";

type FittedPhoneMockupProps = Omit<PhoneMockupProps, "size">;

/** Fit the complete phone to both dimensions of a bounded preview pane. */
export function FittedPhoneMockup({ className, ...props }: FittedPhoneMockupProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 items-center justify-center [container-type:size]",
        className,
      )}
    >
      <div
        className="shrink-0"
        // Leave room for the hardware's side buttons; keep its 8:17 proportions.
        style={{ width: "min(calc(100cqw - 16px), calc(100cqh * 8 / 17))" }}
      >
        <PhoneMockup {...props} />
      </div>
    </div>
  );
}
