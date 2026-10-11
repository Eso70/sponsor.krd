import { PageListImage } from "@/components/shared/PageListImage";
import { PageListUrl } from "@/components/shared/PageListUrl";
import { PageListTraffic } from "@/components/shared/PageListTraffic";
import { formatDate, getAbsoluteUrl } from "@/lib/utils/linktree-utils";
import { FormCollectionBadges } from "./FormCollectionBadges";
import { ClipboardList } from "lucide-react";
import {
  ManagementTable,
  MANAGEMENT_TABLE_CARD_CLASS,
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
  return (
    <ManagementTable
      data={forms}
      getRowKey={(form) => form.id}
      pagination={pagination ?? { mode: "client", pageSize: 20 }}
      paginationCopy={{
        of: locale === "en" ? "of" : locale === "ar" ? "من" : "لە",
        previous: copy.back,
        next: copy.next,
      }}
      columns={[
        { key: "image", header: copy.image, width: "w-16 sm:w-20" },
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
        { key: "actions", header: copy.actions, width: "w-44" },
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
          <td className="px-2 py-3 sm:px-3">
            <PageListImage src={form.logo} name={form.name} variant="table" />
          </td>
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
            <p
              className="line-clamp-2 wrap-break-word text-xs text-gray-600"
              dir="auto"
            >
              {form.description?.trim() || "—"}
            </p>
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
            {form.createdAt ? formatDate(form.createdAt) : "—"}
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
        <div className={MANAGEMENT_TABLE_CARD_CLASS}>
          <PageListImage src={form.logo} name={form.name} variant="mobile" />
          <div className="min-w-0 flex-1 space-y-2">
            <span
              className="block wrap-break-word text-base font-semibold text-gray-900"
              dir="auto"
            >
              {form.name}
            </span>
            <FormCollectionBadges form={form} copy={copy} />
            <p className="line-clamp-2 text-xs text-gray-600" dir="auto">
              {form.description?.trim() || "—"}
            </p>
            {form.slug && (
              <PageListUrl
                url={getAbsoluteUrl(form.slug, "/form")}
                displayUrl={`/form/${form.slug}`}
                labels={copy}
              />
            )}
            <PageListTraffic
              views={form.views ?? 0}
              interactions={form.interactions ?? 0}
              labels={copy}
              compact
            />
            <p className="text-xs text-gray-500">
              {copy.updated}: {formatDate(form.updatedAt)}
            </p>
            <FormRowActions form={form} copy={copy} actions={actions} />
          </div>
        </div>
      )}
    />
  );
}
