"use client";
import { useState } from "react";

/** Selections survive pagination, but never a different owner/search/archive scope. */
export function usePageSelectionState(scope: string) {
  const [state, setState] = useState<{ scope: string; ids: string[] }>({ scope, ids: [] });
  if (state.scope !== scope) setState({ scope, ids: [] });
  const ids = state.scope === scope ? state.ids : [];
  const select = (values: readonly string[]) => setState({ scope, ids: [...new Set(values)] });
  return {
    ids,
    select,
    clear: () => select([]),
    toggle: (id: string) => select(ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]),
  };
}
