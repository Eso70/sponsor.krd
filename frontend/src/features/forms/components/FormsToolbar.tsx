import type { ReactNode } from "react";
import { ManagementToolbar } from "@/components/shared/ManagementToolbar";
import type { FormsCopy } from "../forms-copy";

export type FormsFilter = "active" | "archived";
export function FormsToolbar({
  copy,
  selectionActions,
  busy = false,
  canCreate = true,
  filter,
  onFilter,
  query,
  onSearch,
  onClear,
  onCreate,
  viewMode,
  onViewModeChange,
  isSearchModalOpen,
  accentMode = "tenant",
}: {
  copy: FormsCopy;
  selectionActions?: ReactNode;
  busy?: boolean;
  canCreate?: boolean;
  filter: FormsFilter;
  onFilter: (filter: FormsFilter) => void;
  query: string;
  onSearch: () => void;
  onClear: () => void;
  onCreate: () => void;
  viewMode: "grid" | "table";
  onViewModeChange: (mode: "grid" | "table") => void;
  isSearchModalOpen: boolean;
  accentMode?: "tenant" | "platform";
}) {
  return (
    <ManagementToolbar
      accentMode={accentMode}
      labels={{
        clearSearch: copy.clearSearch,
        searchTooltip: `${copy.search} (Ctrl+K)`,
        search: copy.search,
        searchPlaceholder: copy.searchPlaceholder,
        activePages: copy.active,
        archivedPages: copy.archived,
        active: copy.active,
        archived: copy.archived,
        gridView: copy.gridView,
        tableView: copy.tableView,
        createTooltip: copy.create,
        create: copy.create,
      }}
      leadingAction={selectionActions}
      searchQuery={query}
      isSearchModalOpen={isSearchModalOpen}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      onSearchAction={query.trim() ? onClear : onSearch}
      archiveFilter={filter}
      onArchiveFilterChange={onFilter}
      createDisabled={busy || !canCreate}
      onCreate={onCreate}
    />
  );
}
