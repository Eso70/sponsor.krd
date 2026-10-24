/** Optional authored copy follows its own language without changing dashboard layout. */
export function PageListDescription({
  children,
}: {
  children?: string | null;
}) {
  const text = children?.trim();
  return text ? (
    <p className="mb-2 line-clamp-2 text-xs text-gray-500 sm:mb-3" dir="auto">
      {text}
    </p>
  ) : null;
}
