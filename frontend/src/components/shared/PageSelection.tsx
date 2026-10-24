"use client";

import { createContext, useContext } from "react";
import { CheckboxField } from "./CheckboxField";

export interface PageSelectionControl {
  ids: ReadonlySet<string>;
  disabled: boolean;
  selectLabel: string;
  toggle: (id: string) => void;
}

export const PageSelectionContext = createContext<PageSelectionControl | null>(null);
export const usePageSelection = () => useContext(PageSelectionContext);

/** Selection never triggers a card's open-page action. */
export function PageSelectionCheckbox({ id, name }: { id: string; name: string }) {
  const selection = usePageSelection();
  if (!selection) return null;
  return (
    <span className="inline-flex p-1" onClick={(event) => event.stopPropagation()}>
      <CheckboxField bare checked={selection.ids.has(id)} disabled={selection.disabled}
        label={`${selection.selectLabel}: ${name}`} hideLabel
        onChange={() => selection.toggle(id)} />
    </span>
  );
}
