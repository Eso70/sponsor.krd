"use client";

import { createContext, useContext, type ReactNode } from "react";
import { PageCollectionSkeleton } from "./PageCollectionSkeleton";

interface CollectionLoadingState {
  viewMode: "grid" | "table";
  selectable: boolean;
  columns: number;
  loadingLabel: string;
}
const CollectionLoadingContext = createContext<CollectionLoadingState | null>(null);

/** Lazy collection chunks use the same skeleton as pending requests. */
export function PageManagementCollectionFallback() {
  const state = useContext(CollectionLoadingContext);
  return <PageCollectionSkeleton {...state} />;
}

/** One initial-load and refresh presentation for Forms and Linktree collections. */
export function PageManagementCollection({
  loading, viewMode, selectable = false, columns, loadingLabel, children,
}: {
  loading: boolean;
  viewMode: "grid" | "table";
  selectable?: boolean;
  columns: number;
  loadingLabel: string;
  children: ReactNode;
}) {
  return (
    <CollectionLoadingContext.Provider value={{ viewMode, selectable, columns, loadingLabel }}>
      {loading ? <PageManagementCollectionFallback /> : children}
    </CollectionLoadingContext.Provider>
  );
}
