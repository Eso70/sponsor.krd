import { PageSelectionCheckbox, usePageSelection } from "@/components/shared/PageSelection";
import { PageListMobileCard } from "@/components/shared/PageListMobileCard";
import { PAGE_MANAGEMENT_PAGE_SIZE } from "@/components/shared/page-management";
import { PageListUrl } from "@/components/shared/PageListUrl";
import { PageListTraffic } from "@/components/shared/PageListTraffic";
import { formatDate, getAbsoluteUrl } from "@/lib/utils/linktree-utils";
import { FormCollectionBadges } from "./FormCollectionBadges";
import { ClipboardList } from "lucide-react";
import {
  ManagementTable,
  PAGE_LIST_ACTION_COLUMN_WIDTH,
  MANAGEMENT_TABLE_ROW_CLASS,
} from "@/components/shared/ManagementTable";
import { FormRowActions, type FormActions } from "./FormRowActions";
import type { FormsCopy } from "../forms-copy";
import type { FormSummary, FormLanguage } from "../types";

export function FormsTable({
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
  const selection = usePageSelection();
  return (
    <ManagementTable
      data={forms}
      getRowKey={(form) => form.id}
      pagination={
        pagination ?? { mode: "client", pageSize: PAGE_MANAGEMENT_PAGE_SIZE }
      }
      paginationCopy={{
        of: locale === "en" ? "of" : locale === "ar" ? "من" : "لە",
        previous: copy.back,
        next: copy.next,
      }}
      columns={[
        ...(selection ? [{ key: "selection", header: <span className="sr-only">{selection.selectLabel}</span>, width: "w-12" }] : []),
        { key: "name", header: copy.name, width: "w-32 sm:w-40" },
        {
          key: "description",
          header: copy.descriptionLabel,
          width: "w-32 lg:w-40",
          hideBelow: "md",
        },
        { key: "link", header: "URL", width: "w-32 sm:w-40 lg:w-48" },
        { key: "traffic", header: copy.analytics, width: "w-24" },
        {
          key: "created",
          header: copy.created,
          width: "w-28",
          hideBelow: "xl",
        },
        {
          key: "updated",
          header: copy.updated,
          width: "w-28",
          hideBelow: "xl",
        },
        {
          key: "actions",
          header: copy.actions,
          width: PAGE_LIST_ACTION_COLUMN_WIDTH,
        },
      ]}
      empty={{
        icon: ClipboardList,
        title: filtered
          ? copy.noResults
          : archived
            ? copy.noArchived
            : copy.empty,
        description: filtered
          ? undefined
          : archived
            ? copy.archivedDescription
            : copy.emptyDescription,
      }}
      renderRow={(form) => (
        <tr
          className={MANAGEMENT_TABLE_ROW_CLASS}
          style={{ contentVisibility: "auto", containIntrinsicSize: "80px" }}
        >
          {selection && <td className="px-2 py-3"><PageSelectionCheckbox id={form.id} name={form.name} /></td>}
          <td className="px-2 py-3 sm:px-3">
            <span
              className="mb-1 block wrap-break-word text-xs font-semibold text-gray-900 sm:text-sm"
              dir="auto"
            >
              {form.name}
            </span>
            <FormCollectionBadges form={form} copy={copy} />
          </td>
          <td className="hidden px-2 py-3 md:table-cell sm:px-3">
            {form.description?.trim() && (
              <p
                className="line-clamp-2 wrap-break-word text-xs text-gray-600"
                dir="auto"
              >
                {form.description?.trim()}
              </p>
            )}
          </td>
          <td className="px-2 py-3 sm:px-3">
            {form.slug && (
              <PageListUrl
                url={getAbsoluteUrl(form.slug, "/form")}
                displayUrl={`/form/${form.slug}`}
                labels={copy}
              />
            )}
          </td>
          <td className="hidden px-2 py-3 sm:table-cell sm:px-3">
            <PageListTraffic
              views={form.views ?? 0}
              interactions={form.interactions ?? 0}
              labels={copy}
              compact
            />
          </td>
          <td className="hidden px-2 py-3 text-xs text-gray-600 xl:table-cell sm:px-3">
            {form.createdAt ? formatDate(form.createdAt) : null}
          </td>
          <td className="hidden px-2 py-3 text-xs text-gray-600 xl:table-cell sm:px-3">
            {formatDate(form.updatedAt)}
          </td>
          <td className="px-2 py-3 sm:px-3">
            <FormRowActions form={form} copy={copy} actions={actions} />
          </td>
        </tr>
      )}
      renderCard={(form) => (
        <PageListMobileCard title={form.name}
          selection={<PageSelectionCheckbox id={form.id} name={form.name} />}
          badges={<FormCollectionBadges form={form} copy={copy} />}
          description={form.description?.trim() ? <p className="line-clamp-2 text-xs text-gray-600 [overflow-wrap:anywhere]" dir="auto">{form.description.trim()}</p> : undefined}
          actions={<FormRowActions form={form} copy={copy} actions={actions} />}
        >
          {form.slug && <PageListUrl url={getAbsoluteUrl(form.slug, "/form")} displayUrl={`/form/${form.slug}`} labels={copy} />}
          <PageListTraffic views={form.views ?? 0} interactions={form.interactions ?? 0} labels={copy} compact />
        </PageListMobileCard>
      )}
    />
  );
}
