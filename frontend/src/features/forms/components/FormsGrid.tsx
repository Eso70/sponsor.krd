import { ClipboardList } from "lucide-react";
import { ManagementGrid } from "@/components/shared/ManagementGrid";
import { ManagementCard } from "@/components/shared/ManagementCard";
import { PageListImage } from "@/components/shared/PageListImage";
import { PageListUrl } from "@/components/shared/PageListUrl";
import { PageListTraffic } from "@/components/shared/PageListTraffic";
import { LinktreeMetaField } from "@/components/business/LinktreeMeta";
import { formatDate, getAbsoluteUrl } from "@/lib/utils/linktree-utils";
import { FormCollectionBadges } from "./FormCollectionBadges";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormRowActions, type FormActions } from "./FormRowActions";
import type { FormsCopy } from "../forms-copy";
import type { FormSummary, FormLanguage } from "../types";

export function FormsGrid({
  forms,
  copy,
  actions,
  locale,
  filtered,
  archived,
  pagination,
}: {
  forms: FormSummary[];
  pagination?: import("@/components/shared/ManagementTable").ManagementTablePagination;
  copy: FormsCopy;
  actions: FormActions;
  locale: FormLanguage;
  filtered: boolean;
  archived: boolean;
}) {
  if (!forms.length)
    return (
      <EmptyState
        icon={ClipboardList}
        title={
          filtered ? copy.noResults : archived ? copy.noArchived : copy.empty
        }
        description={
          filtered
            ? ""
            : archived
              ? copy.archivedDescription
              : copy.emptyDescription
        }
      />
    );
  return (
    <ManagementGrid
      desktopColumns={3}
      data={forms}
      getItemKey={(form) => form.id}
      pagination={pagination ?? { mode: "client", pageSize: 20 }}
      paginationCopy={{
        of: locale === "en" ? "of" : locale === "ar" ? "من" : "لە",
        previous: copy.back,
        next: copy.next,
      }}
      renderItem={(form) => (
        <ManagementCard intrinsicHeight={320}>
          <div className="mb-2 flex items-start gap-2 sm:mb-3 sm:gap-3">
            <PageListImage src={form.logo} name={form.name} />
            <div className="min-w-0 flex-1">
              <h3
                className="mb-0.5 truncate text-xs font-bold text-gray-900 sm:mb-1 sm:text-base"
                dir="auto"
                title={form.name}
              >
                {form.name}
              </h3>
              <FormCollectionBadges form={form} copy={copy} />
            </div>
          </div>
          <p
            className="mb-2 line-clamp-2 text-xs text-gray-500 sm:mb-3"
            dir="auto"
          >
            {form.description?.trim() || "—"}
          </p>
          {form.slug && (
            <PageListUrl
              url={getAbsoluteUrl(form.slug, "/form")}
              boxed
              labels={copy}
            />
          )}
          <div className="mb-2 grid grid-cols-2 gap-2 sm:mb-3">
            <LinktreeMetaField
              label={copy.created}
              value={form.createdAt ? formatDate(form.createdAt) : "—"}
            />
            <LinktreeMetaField
              label={copy.updated}
              value={formatDate(form.updatedAt)}
            />
          </div>
          <PageListTraffic
            views={form.views ?? 0}
            interactions={form.interactions ?? 0}
            labels={copy}
          />
          <div className="mt-auto border-t border-gray-200 pt-2 sm:pt-2.5 dark:border-white/10">
            <FormRowActions
              form={form}
              copy={copy}
              actions={actions}
              variant="grid"
            />
          </div>
        </ManagementCard>
      )}
    />
  );
}
