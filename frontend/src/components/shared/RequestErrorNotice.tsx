/** Shared data-load failure; an unavailable collection must not look empty. */
export function RequestErrorNotice({ message }: { message: string }) {
  return <p role="alert" className="my-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">{message}</p>;
}
