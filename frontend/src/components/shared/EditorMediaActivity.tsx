"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
} from "react";

export const EditorMediaActivityContext = createContext<
  ((id: string, busy: boolean) => void) | null
>(null);

/** Keep save/close locked until every mounted image picker finishes reading. */
export function useEditorMediaBusy() {
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());
  const report = useCallback((id: string, busy: boolean) => {
    setPending((current) => {
      if (current.has(id) === busy) return current;
      const next = new Set(current);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  return { busy: pending.size > 0, report };
}

export function useEditorMediaActivity(busy: boolean) {
  const report = useContext(EditorMediaActivityContext);
  const id = useId();
  useEffect(() => {
    report?.(id, busy);
    return () => report?.(id, false);
  }, [busy, id, report]);
}
