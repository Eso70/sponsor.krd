"use client";

import { EditorField } from "./EditorField";
import {
  EDITOR_FIELD_CLASS,
  EDITOR_IMAGE_ACTION_CLASS,
} from "./editor-control-styles";
import { Upload } from "lucide-react";
import { createPortal } from "react-dom";
import { StatCardGrid } from "./StatCardGrid";
import { Skeleton, SkeletonStatCard } from "@/components/shared/Skeleton";
import {
  MANAGEMENT_MODAL_BACKDROP_CLASS,
  MANAGEMENT_MODAL_FOOTER_CLASS,
  MANAGEMENT_MODAL_HEADER_CLASS,
  MANAGEMENT_MODAL_SURFACE_CLASS,
} from "@/components/shared/management-modal-styles";

function ModalFrame({
  children,
  footer = false,
  progress = false,
  maxWidth = "max-w-4xl",
  label,
  platformAdminTheme = false,
}: {
  children: React.ReactNode;
  footer?: boolean;
  progress?: boolean;
  maxWidth?: string;
  label: string;
  platformAdminTheme?: boolean;
}) {
  return createPortal(
    <div
      className="modal-ltr fixed inset-0 z-[140] flex items-center justify-center p-2 sm:p-4"
      role="status"
      aria-busy="true"
      aria-label={label}
      data-sponsor-krd-theme={platformAdminTheme ? true : undefined}
      data-platform-admin-theme={platformAdminTheme ? true : undefined}
    >
      <div className={MANAGEMENT_MODAL_BACKDROP_CLASS} />
      <div className={`${MANAGEMENT_MODAL_SURFACE_CLASS} ${maxWidth}`}>
        <div className={`${MANAGEMENT_MODAL_HEADER_CLASS} items-center`}>
          <div className="min-w-0 flex-1">
            <Skeleton
              className="mb-2 h-6 w-52 max-w-full"
              rounded="rounded-md"
            />
            <Skeleton className="h-3 w-40 max-w-full" rounded="rounded-md" />
          </div>
          <Skeleton className="size-9 shrink-0" rounded="rounded-xl" />
        </div>
        {progress ? (
          <div className="grid grid-cols-3 gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Skeleton className="size-7 shrink-0" rounded="rounded-full" />
                <Skeleton className="h-3 flex-1" rounded="rounded-md" />
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex-1 overflow-hidden p-5 sm:p-6">{children}</div>
        {footer ? (
          <div
            className={`${MANAGEMENT_MODAL_FOOTER_CLASS} flex gap-3 sm:justify-end`}
          >
            <Skeleton
              className="h-11 flex-1 sm:max-w-28"
              rounded="rounded-xl"
            />
            <Skeleton
              className="h-11 flex-1 sm:max-w-36"
              rounded="rounded-xl"
            />
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function SkeletonLinktreeBasicInfo({
  loadingLabel = "Loading Linktree information",
  labels = {
    upload: "Logo",
    name: "Headline",
    subtitle: "Promotion slogan",
    description: "Description",
  },
}: {
  loadingLabel?: string;
  labels?: {
    upload: string;
    name: string;
    subtitle: string;
    description: string;
  };
} = {}) {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-busy="true"
      aria-label={loadingLabel}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton
          className="size-24 border border-slate-200 dark:border-white/10"
          rounded="rounded-xl"
        />
        <button type="button" disabled className={EDITOR_IMAGE_ACTION_CLASS}>
          <Upload className="size-3.5" />
          {labels.upload}
        </button>
      </div>
      <EditorField label={labels.name} className={EDITOR_FIELD_CLASS}>
        <Skeleton className="h-10 w-full" rounded="rounded-lg" />
      </EditorField>
      <EditorField label={labels.subtitle} className={EDITOR_FIELD_CLASS}>
        <Skeleton className="h-10 w-full" rounded="rounded-lg" />
      </EditorField>
      <EditorField label={labels.description} className={EDITOR_FIELD_CLASS}>
        <Skeleton className="h-20 w-full" rounded="rounded-lg" />
      </EditorField>
    </div>
  );
}

export function SkeletonBusinessAnalyticsModal({
  platformAdminTheme = false,
  loadingLabel = "Loading business analytics",
  contentLoadingLabel,
}: {
  platformAdminTheme?: boolean;
  loadingLabel?: string;
  contentLoadingLabel?: string;
} = {}) {
  return (
    <ModalFrame label={loadingLabel} platformAdminTheme={platformAdminTheme}>
      <SkeletonBusinessAnalyticsContent loadingLabel={contentLoadingLabel} />
    </ModalFrame>
  );
}

export function SkeletonBusinessAnalyticsContent({
  loadingLabel = "Loading business analytics data",
}: { loadingLabel?: string } = {}) {
  return (
    <div
      className="max-h-[64vh] space-y-5 overflow-hidden"
      role="status"
      aria-busy="true"
      aria-label={loadingLabel}
    >
      <StatCardGrid columns={2}>
        <SkeletonStatCard />
        <SkeletonStatCard />
      </StatCardGrid>
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" rounded="rounded-xl" />
        <Skeleton className="h-10 w-52" rounded="rounded-xl" />
      </div>
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="size-7" rounded="rounded-lg" />
          <Skeleton className="h-4 w-36" rounded="rounded-md" />
        </div>
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 dark:divide-white/5 dark:border-white/10">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-3">
              <Skeleton className="size-10 shrink-0" rounded="rounded-full" />
              <div className="grid min-w-0 flex-1 grid-cols-5 items-center gap-4">
                <div className="col-span-2">
                  <Skeleton className="mb-2 h-3.5 w-3/5" rounded="rounded-md" />
                  <Skeleton className="h-2.5 w-4/5" rounded="rounded-md" />
                </div>
                <Skeleton
                  className="h-4 w-12 justify-self-center"
                  rounded="rounded-md"
                />
                <Skeleton
                  className="h-4 w-12 justify-self-center"
                  rounded="rounded-md"
                />
                <Skeleton
                  className="h-4 w-12 justify-self-center"
                  rounded="rounded-md"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mirrors BusinessInfoStep while an existing business record is fetched. */
export function SkeletonBusinessInfoForm({
  loadingLabel = "Loading business information",
}: { loadingLabel?: string } = {}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={loadingLabel}
      className="min-h-[50vh] space-y-6"
    >
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="size-24" rounded="rounded-2xl" />
          <Skeleton className="h-3 w-16" rounded="rounded-md" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="size-16" rounded="rounded-2xl" />
          <Skeleton className="h-3 w-16" rounded="rounded-md" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="size-20" rounded="rounded-full" />
          <Skeleton className="h-3 w-20" rounded="rounded-md" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={`owner-${index}`}>
            <Skeleton className="mb-2 h-3 w-24" rounded="rounded-md" />
            <Skeleton className="h-11 w-full" rounded="rounded-xl" />
          </div>
        ))}
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={`field-${index}`}>
            <Skeleton className="mb-2 h-3 w-28" rounded="rounded-md" />
            <Skeleton className="h-11 w-full" rounded="rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
