"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ClipboardList } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { DashboardSurface } from "@/components/shared/DashboardSurface";
import { PageHeader } from "@/components/shared/PageHeader";
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
import { FormsStatsSkeleton, FormsCollectionSkeleton } from "./FormSkeletons";
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
    load,
    get,
    save,
    status,
    archive,
    remove,
  } = useFormsManagement(scope, page, query, filter);
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
  const refresh = () => {
    void load();
  };
  const run = (operation: Promise<unknown>) => {
    void operation.then(() => setPage(0)).catch(() => undefined);
  };
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
    <>
      {loading ? (
        <FormsStatsSkeleton label={copy.loading} />
      ) : (
        <FormsStats
          count={metrics.totalForms ?? forms.length}
          copy={copy}
          metrics={metrics}
        />
      )}
      <DashboardSurface>
        <PageHeader
          title={copy.title}
          description={copy.description}
          icon={ClipboardList}
          action={
            <FormsToolbar
              copy={copy}
              busy={busy || !!opening}
              canCreate={capabilities.create}
              filter={filter}
              onFilter={changeFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              isSearchModalOpen={search}
              query={query}
              onSearch={() => setSearch(true)}
              onClear={() => changeQuery("")}
              onRefresh={refresh}
              onCreate={() =>
                setEditor({
                  form: createForm(),
                  preview: false,
                  isNew: true,
                })
              }
            />
          }
        />
        <div className="border-t border-slate-100 pt-6 dark:border-white/5">
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
          {loading ? (
            <FormsCollectionSkeleton label={copy.loading} viewMode={viewMode} />
          ) : (
            <Collection
              forms={visible}
              pagination={{
                mode: "server",
                page,
                pageSize: 20,
                totalItems: total,
                totalPages: Math.max(1, Math.ceil(total / 20)),
                onPageChange: setPage,
              }}
              copy={copy}
              locale={locale}
              filtered={!!query.trim()}
              archived={filter === "archived"}
              actions={{
                onEdit: (form) => openEditor(form, false),
                onArchive: (form) => run(archive(form)),
                onPause: (form) =>
                  run(
                    status(
                      form,
                      form.status === "active" ? "paused" : "active",
                    ),
                  ),
                onOpen: (form) =>
                  window.open(
                    `/form/${form.slug}`,
                    "_blank",
                    "noopener,noreferrer",
                  ),
                onAnalytics: setAnalyticsForm,
                busy,
                capabilities,
                onDelete: setDeleting,
              }}
            />
          )}
        </div>
      </DashboardSurface>
      <AnimatePresence>
        {(editor || opening) && (
          <FormEditorDrawer
            key={editor?.form.id ?? opening!.id}
            initialForm={editor?.form ?? null}
            previewOnly={editor?.preview ?? opening?.preview ?? false}
            isNew={editor?.isNew}
            scope={scope}
            headerControls={headerControls}
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
      </AnimatePresence>
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
      <AnimatePresence>
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
      </AnimatePresence>
      <ConfirmDeleteModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) {
            await remove(deleting.id);
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
    </>
  );
}
