import { PageListName } from "./PageListName";
import type { ReactNode } from "react";
import { PageListImage } from "./PageListImage";

/** Centers the identity below ManagementCard media with half of the logo overlapping. */
export function PageListCardHeader({
  name,
  logo,
  subtitle,
  badges,
  verified,
  verificationLabel,
  size = "default",
}: {
  name: string;
  logo?: string | null;
  subtitle?: string | null;
  badges?: ReactNode;
  verified?: boolean;
  verificationLabel?: string;
  size?: "default" | "large";
}) {
  return (
    <div
      className={`relative mb-3 min-w-0 text-center ${logo ? "-mt-9 sm:-mt-12 md:-mt-[52px]" : ""}`}
    >
      {logo && (
        <div className="relative z-10 mx-auto mb-3 w-fit rounded-full bg-white dark:bg-[#1c222b]">
          <PageListImage src={logo} name={name} variant={size === "large" ? "grid-large" : "grid"} />
        </div>
      )}
      <div className="min-w-0">
        <h3
          className={`mb-1 font-bold text-gray-900 ${size === "large" ? "break-words text-lg sm:text-xl" : "truncate text-xs sm:text-base"}`}
          dir="auto"
          title={name}
        >
          <PageListName name={name} verified={verified} verificationLabel={verificationLabel} />
        </h3>
        {subtitle?.trim() && (
          <p className="mb-1.5 line-clamp-2 text-xs text-gray-600" dir="auto">
            {subtitle.trim()}
          </p>
        )}
        {badges}
      </div>
    </div>
  );
}
