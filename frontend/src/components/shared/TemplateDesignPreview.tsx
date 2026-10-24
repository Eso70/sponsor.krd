/** A miniature page layout communicates the template without opening a real page. */
export function TemplateDesignPreview({ gradient }: { gradient: string }) {
  return (
    <span className={`absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-linear-to-br ${gradient}`}>
      <span className="size-5 rounded-full bg-white/80" />
      <span className="h-1 w-7 rounded-full bg-white/70" />
      <span className="h-2 w-14 max-w-[75%] rounded-md bg-white/40" />
      <span className="h-2 w-14 max-w-[75%] rounded-md bg-white/40" />
      <span className="h-2 w-14 max-w-[75%] rounded-md bg-white/40" />
    </span>
  );
}
