import { ManagementToolbar } from "@/components/shared/ManagementToolbar";
import type { FormsCopy } from "../forms-copy";

export type FormsFilter = "active" | "archived";
export function FormsToolbar({
  copy,
  busy = false,
  canCreate = true,
  filter,
  onFilter,
  query,
  onSearch,
  onClear,
  onRefresh,
  onCreate,
  viewMode,
  onViewModeChange,
  isSearchModalOpen,
}: {
  copy: FormsCopy;
  busy?: boolean;
  canCreate?: boolean;
  filter: FormsFilter;
  onFilter: (filter: FormsFilter) => void;
  query: string;
  onSearch: () => void;
  onClear: () => void;
  onRefresh: () => void;
  onCreate: () => void;
  viewMode: "grid" | "table";
  onViewModeChange: (mode: "grid" | "table") => void;
  isSearchModalOpen: boolean;
}) {
  return (
    <ManagementToolbar
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
        refreshPages: copy.refresh,
        refresh: copy.refresh,
        createTooltip: copy.create,
        create: copy.create,
      }}
      searchQuery={query}
      isSearchModalOpen={isSearchModalOpen}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      onSearchAction={query.trim() ? onClear : onSearch}
      archiveFilter={filter}
      onArchiveFilterChange={onFilter}
      onRefresh={onRefresh}
      isRefreshing={busy}
      createDisabled={busy || !canCreate}
      onCreate={onCreate}
    />
  );
}
