"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { SegmentedControl } from "./SegmentedControl";
import { SettingsActionButton } from "./SettingsActionButton";
import { ManagementViewToggle } from "./ManagementViewToggle";
import { ManagementSearchTrigger } from "./ManagementSearchTrigger";
import styles from "./page-management.module.css";

export interface ManagementToolbarCopy {
  clearSearch: string;
  searchTooltip: string;
  search: string;
  searchPlaceholder: string;
  activePages: string;
  archivedPages: string;
  active: string;
  archived: string;
  gridView: string;
  tableView: string;
  createTooltip: string;
  create: string;
}

export function ManagementToolbar({
  labels,
  searchQuery,
  isSearchModalOpen,
  viewMode,
  onSearchAction,
  onViewModeChange,
  onCreate,
  archiveFilter = "active",
  onArchiveFilterChange,
  createDisabled = false,
  createDisabledTooltip,
  accentMode = "tenant",
  leadingAction,
}: {
  labels: ManagementToolbarCopy;
  searchQuery: string;
  isSearchModalOpen: boolean;
  viewMode: "grid" | "table";
  onSearchAction: () => void;
  onViewModeChange: (mode: "grid" | "table") => void;
  onCreate: () => void;
  archiveFilter?: "active" | "archived";
  onArchiveFilterChange?: (filter: "active" | "archived") => void;
  createDisabled?: boolean;
  createDisabledTooltip?: string;
  accentMode?: "tenant" | "platform";
  leadingAction?: ReactNode;
}) {
  return (
    <div data-page-management-toolbar>
      <div className={styles.toolbar}>
        <ManagementSearchTrigger query={searchQuery} open={isSearchModalOpen} onClick={onSearchAction} labels={labels} />
        {onArchiveFilterChange && (
          <SegmentedControl value={archiveFilter} onChange={onArchiveFilterChange}
            accentMode={accentMode} className={styles.status}
            options={[
              { value: "active", label: labels.active, tooltip: labels.activePages },
              { value: "archived", label: labels.archived, tooltip: labels.archivedPages },
            ]} />
        )}
        <ManagementViewToggle value={viewMode} onChange={onViewModeChange}
          gridLabel={labels.gridView} tableLabel={labels.tableView} accentMode={accentMode} />
        <SettingsActionButton label={labels.create} icon={Plus} accentMode={accentMode}
          disabled={createDisabled} onClick={onCreate}
          tooltip={createDisabled ? createDisabledTooltip ?? labels.createTooltip : labels.createTooltip} />
      </div>
      {leadingAction}
    </div>
  );
}
