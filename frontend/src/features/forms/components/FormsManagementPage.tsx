"use client";
import { useDeleteSelectedPages } from "@/features/shared/use-delete-selected-pages";
import { PageManagementCollection } from "@/components/shared/PageManagementCollection";

import { PageSelectionContext } from "@/components/shared/PageSelection";
import { usePageSelectionState } from "@/components/shared/use-page-selection-state";
import { PageSelectionActions } from "@/components/shared/PageSelectionActions";
import { pageSelectionCopy } from "@/components/shared/page-selection-copy";
import { clearSelectedAnalytics } from "@/features/shared/clear-selected-analytics";
import { formsApi } from "../api";
import { useRegisterDashboardRefresh } from "@/components/shared/dashboard-refresh";
import { usePagePinning } from "@/features/shared/use-page-pinning";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";
import { DrawerPresence } from "@/components/shared/DrawerPresence";
import { PageManagementSection } from "@/components/shared/PageManagementSection";
import { PAGE_MANAGEMENT_PAGE_SIZE } from "@/components/shared/page-management";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { FormsStats } from "./FormsStats";
import { FormsTable } from "./FormsTable";
import { FormsGrid } from "./FormsGrid";
import { FormsToolbar, type FormsFilter } from "./FormsToolbar";
import { FormEditorDrawer } from "./FormEditorDrawer";
import { ManagementSearchModal } from "@/components/shared/ManagementSearchModal";
import { formsCopy } from "../forms-copy";
import { createForm } from "../forms-model";
import type { FormDraft, FormLanguage, FormSummary } from "../types";

import { useFormsManagement } from "../use-forms-management";
import type { FormsScope } from "../api";
import { FormRequestError } from "./FormRequestError";
import { FormInsightsModal } from "./FormInsightsModal";

export function FormsManagementPage({
  locale,
  accentColor,
  headerControls,
  scope = "business",
  capabilities = { create: true, update: true, remove: true },
}: {
  scope?: FormsScope;
  capabilities?: { create: boolean; update: boolean; remove: boolean };
  locale: FormLanguage;
  accentColor?: string | null;
  headerControls?: ReactNode;
}) {
  const copy = formsCopy(locale);
  const [analyticsForm, setAnalyticsForm] = useState<FormSummary | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FormsFilter>("active");
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState(false);
  const {
    forms,
    total,
    metrics,
    loading,
    busy,
    failed,
    failureReason,
    dataUnavailable,
    load,
    get,
    save,
    status,
    archive,
    duplicate,
    remove,
  } = useFormsManagement(scope, page, query, filter);
  const lastAvailablePage = Math.max(0, Math.ceil(total / PAGE_MANAGEMENT_PAGE_SIZE) - 1);
  if (!loading && !dataUnavailable && page > lastAvailablePage) setPage(lastAvailablePage);
  const apiBase = scope === "platform" ? "/api/platform/forms" : "/api/forms";
  const selectionScope = JSON.stringify([scope, query, filter, capabilities.remove]);
  const selection = usePageSelectionState(selectionScope);
  const [selectingAll, setSelectingAll] = useState(false);
  const [clearingAnalytics, setClearingAnalytics] = useState(false);
  const selectionRequest = useRef<AbortController | null>(null);
  useEffect(() => () => selectionRequest.current?.abort(), [selectionScope]);
  const bulkDelete = useDeleteSelectedPages({
    apiBase, enabled: capabilities.remove && !loading && !busy && !selectingAll && !clearingAnalytics,
    onSelectionChange: selection.select,
    refresh: async () => { if (!(await load())) throw new Error(copy.loadError); },
  });
  const selectionDisabled = loading || busy || selectingAll || clearingAnalytics || bulkDelete.deleting;
  const selectionControl = capabilities.remove ? {
    ids: new Set(selection.ids), disabled: selectionDisabled,
    selectLabel: pageSelectionCopy(locale).selectForm, toggle: selection.toggle,
  } : null;
  const selectAll = async () => {
    if (selectionDisabled) return;
    const controller = new AbortController();
    selectionRequest.current?.abort();
    selectionRequest.current = controller;
    setSelectingAll(true);
    try {
      const ids = await formsApi.selection(scope, query, filter, controller.signal);
      if (!controller.signal.aborted && selectionRequest.current === controller) selection.select(ids);
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("Form selection failed:", error);
        toast.error(copy.loadError);
      }
    } finally {
      if (selectionRequest.current === controller) {
        selectionRequest.current = null;
        setSelectingAll(false);
      }
    }
  };
  const deleteSelectedAnalytics = async (ids: readonly string[]) => {
    if (clearingAnalytics || !capabilities.remove || !ids.length) throw new Error("Analytics deletion unavailable");
    setClearingAnalytics(true);
    try { await clearSelectedAnalytics(apiBase, ids); }
    finally {
      try { if (!(await load())) throw new Error(copy.loadError); }
      finally { setClearingAnalytics(false); }
    }
  };
  const pinControl = usePagePinning(
    apiBase,
    locale,
    async () => {
      if (page !== 0) setPage(0);
      else await load();
    },
  );
  const changeQuery = (query: string) => {
    setQuery(query);
    setPage(0);
  };
  const changeFilter = (filter: FormsFilter) => {
    setFilter(filter);
    setPage(0);
  };
  const [editor, setEditor] = useState<{
    form: FormDraft;
    preview: boolean;
    isNew?: boolean;
  } | null>(null);
  const openingRequest = useRef(0);
  const [opening, setOpening] = useState<{
    id: string;
    preview: boolean;
  } | null>(null);
  const cancelOpening = () => {
    openingRequest.current += 1;
    setOpening(null);
  };
  useEffect(
    () => () => {
      openingRequest.current += 1;
    },
    [],
  );
  const [deleting, setDeleting] = useState<FormSummary | null>(null);
  useEffect(() => {
    if (failed)
      toast.error(
        failureReason === "publish"
          ? copy.publishError
          : failureReason === "conflict"
            ? copy.saveConflict
            : copy.loadError,
      );
  }, [failed, failureReason, copy]);
  useRegisterDashboardRefresh("forms", async () => {
    if (!(await load())) throw new Error(copy.loadError);
  });
  const collection = forms;
  const visible = forms;
  const openEditor = (form: FormSummary, preview: boolean) => {
    const requestId = ++openingRequest.current;
    setOpening({ id: form.id, preview });
    void get(form)
      .then((full) => {
        if (openingRequest.current === requestId)
          setEditor({ form: full, preview });
      })
      .catch(() => undefined)
      .finally(() => {
        if (openingRequest.current === requestId) setOpening(null);
      });
  };
  const Collection = viewMode === "grid" ? FormsGrid : FormsTable;
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k" &&
        !editor &&
        !opening &&
        !deleting
      ) {
        event.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editor, deleting, opening]);
  return (
    <PageSelectionContext.Provider value={selectionControl}>
      <FormsStats count={metrics.totalForms ?? null} copy={copy} metrics={metrics}
        loading={loading} unavailable={dataUnavailable} />
      <PageManagementSection
        title={copy.title}
        description={copy.description}
        icon={<ClipboardList className="size-5" />}
        toolbar={
          <FormsToolbar
            accentMode={scope === "platform" ? "platform" : "tenant"}
            copy={copy}
            busy={busy || !!opening || bulkDelete.deleting}
            canCreate={capabilities.create}
            selectionActions={capabilities.remove && <PageSelectionActions key={selectionScope} resource="form"
              ids={selection.ids} locale={locale} disabled={selectionDisabled} onSelectAll={() => void selectAll()}
              onDeselect={selection.clear} onDelete={deleteSelectedAnalytics}
              onDeleteRecords={bulkDelete.remove} />}
            filter={filter}
            onFilter={changeFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isSearchModalOpen={search}
            query={query}
            onSearch={() => setSearch(true)}
            onClear={() => changeQuery("")}
            onCreate={() =>
              setEditor({
                form: createForm(),
                preview: false,
                isNew: true,
              })
            }
          />
        }
      >
        {failed && (
          <FormRequestError
            message={
              failureReason === "publish"
                ? copy.publishError
                : failureReason === "conflict"
                  ? copy.saveConflict
                  : copy.loadError
            }
          />
        )}
        <PageManagementCollection showTableBanner loading={loading || bulkDelete.deleting} viewMode={viewMode}
          selectable={Boolean(selectionControl)} columns={selectionControl ? 8 : 7}
          loadingLabel={copy.loading}>
          <Collection
            forms={visible}
            pagination={{
              mode: "server",
              page: page + 1,
              pageSize: PAGE_MANAGEMENT_PAGE_SIZE,
              totalItems: total,
              totalPages: Math.max(
                1,
                Math.ceil(total / PAGE_MANAGEMENT_PAGE_SIZE),
              ),
              onPageChange: (nextPage) => setPage(nextPage - 1),
            }}
            copy={copy}
            locale={locale}
            filtered={!!query.trim()}
            archived={filter === "archived"}
            actions={{
              onEdit: (form) => openEditor(form, false),
              onOpen: (form) =>
                window.open(
                  `/form/${form.slug}`,
                  "_blank",
                  "noopener,noreferrer",
                ),
              onAnalytics: setAnalyticsForm,
              busy: busy || bulkDelete.deleting,
              capabilities,
              pinControl: capabilities.update ? pinControl : undefined,
              sharing: capabilities.update
                ? {
                    apiBase:
                      scope === "platform"
                        ? "/api/platform/forms"
                        : "/api/forms",
                    locale,
                    disabled: busy,
                    accentColor,
                    platformTheme: scope === "platform",
                    pageType: "form",
                    headerControls,
                  }
                : undefined,
              onDelete: setDeleting,
            }}
          />
        </PageManagementCollection>
      </PageManagementSection>
      <DrawerPresence>
        {(editor || opening) && (
          <FormEditorDrawer
            key={editor?.form.id ?? opening!.id}
            initialForm={editor?.form ?? null}
            previewOnly={editor?.preview ?? opening?.preview ?? false}
            isNew={editor?.isNew}
            scope={scope}
            headerControls={headerControls}
            canDuplicate={capabilities.create}
            onDuplicate={
              capabilities.create && !editor?.isNew
                ? async (id, form, slug) => {
                    await duplicate(id, form, slug);
                    setPage(0);
                  }
                : undefined
            }
            onManage={
              capabilities.update && !editor?.isNew
                ? async (action, form) => {
                    const updated =
                      action === "archive"
                        ? await archive(form)
                        : await status(
                            form,
                            form.status === "active" ? "paused" : "active",
                          );
                    if (action === "archive") selection.select(selection.ids.filter((id) => id !== form.id));
                    toast.success(
                      action === "archive"
                        ? form.isArchived
                          ? copy.notifications.restored
                          : copy.notifications.archived
                        : form.status === "active"
                          ? copy.notifications.paused
                          : copy.notifications.activated,
                    );
                    return updated;
                  }
                : undefined
            }
            copy={copy}
            direction={locale === "en" ? "ltr" : "rtl"}
            accentColor={accentColor}
            onClose={() => {
              cancelOpening();
              setEditor(null);
            }}
            onSave={async (form) => {
              await save(form, !!editor?.isNew);
              setEditor(null);
              setPage(0);
            }}
          />
        )}
      </DrawerPresence>
      {search && (
        <ManagementSearchModal
          isOpen
          searchQuery={query}
          onSearchQueryChange={changeQuery}
          onClose={() => setSearch(false)}
          items={collection.map((form) => ({
            id: form.id,
            name: form.name,
            image: form.logo || null,
            subtitle: copy[form.status],
          }))}
          onSelect={(item) => {
            const form = collection.find(
              (candidate) => candidate.id === item.id,
            );
            if (form) openEditor(form, !capabilities.update);
          }}
          copy={{
            placeholder: copy.searchPlaceholder,
            close: copy.close,
            prompt: copy.search,
            noResults: copy.noResults,
            action: !capabilities.update ? copy.preview : copy.edit,
          }}
        />
      )}
      <DrawerPresence>
        {analyticsForm && (
          <FormInsightsModal
            key={analyticsForm.id}
            headerControls={headerControls}
            canDeleteResponses={capabilities.remove}
            onResponsesDeleted={() => {
              void load();
            }}
            form={analyticsForm}
            scope={scope}
            locale={locale}
            copy={copy}
            accentColor={accentColor}
            onClose={() => setAnalyticsForm(null)}
          />
        )}
      </DrawerPresence>
      <ConfirmDeleteModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) {
            await remove(deleting.id);
            selection.select(selection.ids.filter((id) => id !== deleting.id));
            toast.success(copy.notifications.deleted);
            setPage(0);
          }
        }}
        title={copy.deleteTitle}
        message={copy.deleteMessage}
        confirmLabel={copy.remove}
        cancelLabel={copy.cancel}
        closeLabel={copy.close}
        zIndexClassName="z-[160]"
      />
    </PageSelectionContext.Provider>
  );
}
