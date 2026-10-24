import type { ReactNode } from "react";
import { MANAGEMENT_TABLE_CARD_CLASS } from "./ManagementTable";

/** The same record details and actions, stacked for a narrow table viewport. */
export function PageListMobileCard({ title, image, selection, badges, description, children, actions }: {
  title: string;
  image?: ReactNode;
  selection?: ReactNode;
  badges?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className={`${MANAGEMENT_TABLE_CARD_CLASS} min-w-0 flex-col`}>
      <div className="flex min-w-0 items-start gap-3">
        {selection}
        {image}
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="text-sm font-semibold leading-snug text-gray-900 [overflow-wrap:anywhere]" dir="auto">{title}</h3>
          {badges}
        </div>
      </div>
      {description}
      <div className="min-w-0 space-y-2">{children}</div>
      <div className="flex min-w-0 flex-wrap items-center gap-1 border-t border-slate-100 pt-2 dark:border-white/5">{actions}</div>
    </div>
  );
}
