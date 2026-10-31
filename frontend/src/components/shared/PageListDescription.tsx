/** Optional authored copy follows its own language without changing dashboard layout. */
export function PageListDescription({
  children,
  size = "default",
  clamp = true,
}: {
  children?: string | null;
  size?: "default" | "large";
  clamp?: boolean;
}) {
  const text = children?.trim();
  return text ? (
    <p className={`break-words text-gray-500 ${size === "large" ? `mb-4 text-sm leading-6 ${clamp ? "line-clamp-3" : ""}` : `mb-2 text-xs sm:mb-3 ${clamp ? "line-clamp-2" : ""}`}`} dir="auto">
      {text}
    </p>
  ) : null;
}
