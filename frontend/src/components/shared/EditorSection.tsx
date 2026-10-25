"use client";

import { SHARED_CARD_CLASS } from "./shared-surface-styles";
import { useId, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import styles from "./EditorSection.module.css";
import { VisibilitySwitch } from "@/components/shared/VisibilitySwitch";

/** Compact accordion shared by dashboard editors. */
export function EditorSection({
  title,
  icon: Icon,
  summary,
  disabled = false,
  open,
  onToggle,
  enabled,
  onEnabled,
  enabledLabel,
  children,
  step,
  leading,
  actions,
  reorderId,
  reorderGroup,
}: {
  title: string;
  icon?: LucideIcon;
  summary?: string;
  disabled?: boolean;
  open: boolean;
  onToggle: () => void;
  enabled?: boolean;
  onEnabled?: (enabled: boolean) => void;
  enabledLabel?: string;
  children: ReactNode;
  step?: number;
  leading?: ReactNode;
  actions?: ReactNode;
  reorderId?: string;
  reorderGroup?: string;
}) {
  const id = useId();
  return (
    <section
      data-open={open}
      data-reorder-id={reorderId}
      data-reorder-group={reorderGroup}
      className={`${styles.section} ${SHARED_CARD_CLASS} overflow-hidden`}
    >
      <div className={styles.header}>
        {leading}
        <button
          type="button"
          disabled={disabled}
          data-has-icon={!!(Icon || step) || undefined}
          aria-expanded={open}
          aria-controls={id}
          aria-describedby={!open && summary ? `${id}-summary` : undefined}
          onClick={onToggle}
          className={styles.toggle}
        >
          <span className={styles.identity}>
            {(Icon || step) && (
              <span aria-hidden="true" className={styles.icon}>
                {Icon ? <Icon className="size-[18px]" /> : step}
              </span>
            )}
            <span className={styles.title}>{title}</span>
          </span>
          <span className={styles.trailing}>
            {!open && summary && (
              <span
                id={`${id}-summary`}
                aria-hidden="true"
                className={styles.summary}
              >
                {summary}
              </span>
            )}
            <span aria-hidden="true" className={styles.chevron}>
              <ChevronDown className="size-4" />
            </span>
          </span>
        </button>
        {actions && <div className={styles.actions}>{actions}</div>}
        {onEnabled && (
          <VisibilitySwitch
            compact
            checked={enabled ?? true}
            onChange={onEnabled}
            label={enabledLabel ?? title}
          />
        )}
      </div>
      <div id={id} hidden={!open} className={`${styles.body} space-y-4`}>
        {children}
      </div>
    </section>
  );
}
