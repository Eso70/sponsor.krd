import { PageListDescription } from "@/components/shared/PageListDescription";
import { PageSelectionCheckbox } from "@/components/shared/PageSelection";
import { PAGE_MANAGEMENT_PAGE_SIZE } from "@/components/shared/page-management";
import { PageListCardMedia } from "@/components/shared/PageListCardMedia";
import { pageListLogo } from "@/components/shared/page-list-logo";
import { PageListCardHeader } from "@/components/shared/PageListCardHeader";
import { PageListBanner } from "@/components/shared/PageListBanner";
import { ClipboardList } from "lucide-react";
import { PagePinButton } from "@/components/shared/PagePinButton";
import { ManagementGrid } from "@/components/shared/ManagementGrid";
import { ManagementCard } from "@/components/shared/ManagementCard";
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
      pagination={
        pagination ?? { mode: "client", pageSize: PAGE_MANAGEMENT_PAGE_SIZE }
      }
      paginationCopy={{
        of: locale === "en" ? "of" : locale === "ar" ? "من" : "لە",
        previous: copy.back,
        next: copy.next,
      }}
      renderItem={(form) => (
        <ManagementCard
          intrinsicHeight={480}
          className="text-center"
          media={
            <PageListCardMedia
              action={
                <PagePinButton
                  iconOnly
                  id={form.id}
                  pinned={form.isPinned}
                  control={
                    actions.capabilities?.update === false
                      ? undefined
                      : actions.pinControl
                  }
                  disabled={actions.busy}
                />
              }
            >
              <PageListBanner src={form.banner} />
              <div className="absolute left-3 top-3 z-10"><PageSelectionCheckbox id={form.id} name={form.name} /></div>
            </PageListCardMedia>
          }
        >
          <PageListCardHeader
            name={form.name}
            logo={pageListLogo(form.logo)}
            badges={
              <FormCollectionBadges
                form={form}
                copy={copy}
                className="justify-center"
              />
            }
          />
          <PageListDescription>{form.description}</PageListDescription>
          {form.slug && (
            <PageListUrl
              url={getAbsoluteUrl(form.slug, "/form")}
              boxed
              labels={copy}
            />
          )}
          <div className="mb-2 grid grid-cols-2 gap-2 sm:mb-3">
            {form.createdAt && (
              <LinktreeMetaField
                label={copy.created}
                value={formatDate(form.createdAt)}
              />
            )}
            <LinktreeMetaField
              label={copy.updated}
              value={formatDate(form.updatedAt)}
            />
          </div>
          <PageListTraffic
            centered
            views={form.views ?? 0}
            interactions={form.interactions ?? 0}
            labels={copy}
          />
            <FormRowActions
              form={form}
              copy={copy}
              actions={actions}
              variant="grid"
            />
        </ManagementCard>
      )}
    />
  );
}
