"use client";
import { formAnswerText, completionTime } from "../form-response-utils";
import { Fragment, useState } from "react";
import { FormResponseToggle } from "./FormResponseToggle";
import { Inbox } from "lucide-react";
import { ManagementTable } from "@/components/shared/ManagementTable";
import { FormSubmissionDetails } from "./FormSubmissionDetails";
import type { FormSubmissionsPage, FormLanguage } from "../types";
import type { FormsCopy } from "../forms-copy";

export function FormSubmissionsTable({
  data,
  page,
  onPageChange,
  copy,
  locale,
  pageSize = 20,
}: {
  data: FormSubmissionsPage;
  page: number;
  onPageChange: (page: number) => void;
  copy: FormsCopy;
  locale: FormLanguage;
  pageSize?: 20 | 50 | 100;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (id: string) =>
    setExpanded((value) => (value === id ? null : id));
  const date = (row: import("../types").FormSubmission) =>
    new Intl.DateTimeFormat(locale === "ckb" ? "ckb-IQ" : locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(row.createdAt));
  return (
    <ManagementTable
      compact
      minWidth="min-w-[640px]"
      data={data.items}
      getRowKey={(row) => row.id}
      columns={[
        { key: "date", header: copy.submittedAt, width: "w-36" },
        { key: "answers", header: copy.answerPreview },
        { key: "source", header: copy.source, width: "w-28" },
        { key: "time", header: copy.timeSpent, width: "w-24" },
        { key: "details", header: copy.viewDetails, width: "w-12" },
      ]}
      pagination={{
        mode: "server",
        page,
        pageSize,
        totalItems: data.total,
        totalPages: Math.max(1, Math.ceil(data.total / pageSize)),
        onPageChange,
      }}
      paginationCopy={{
        of: locale === "en" ? "of" : locale === "ar" ? "من" : "لە",
        previous: copy.back,
        next: copy.next,
      }}
      empty={{ icon: Inbox, title: copy.noResponses }}
      renderCard={(row) => (
        <div className="space-y-3 rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500">{date(row)}</p>
            <FormResponseToggle
              expanded={expanded === row.id}
              copy={copy}
              onClick={() => toggle(row.id)}
            />
          </div>
          <FormSubmissionDetails
            locale={locale}
            response={row}
            preview={expanded !== row.id}
          />
        </div>
      )}
      renderRow={(row) => (
        <Fragment>
          <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50/70 dark:border-white/5 dark:hover:bg-white/[0.025]">
            <td className="px-3 py-3 align-top text-xs text-slate-500">
              {date(row)}
            </td>
            <td className="px-3 py-3">
              <p
                className="line-clamp-2 break-words text-sm font-medium text-slate-700 dark:text-slate-200"
                dir="auto"
              >
                {row.answers
                  .slice(0, 2)
                  .map((answer) => formAnswerText(answer.value))
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
            </td>
            <td className="px-3 py-3 text-xs text-slate-500">
              <span
                className="block max-w-28 truncate"
                title={row.attribution?.source}
              >
                {row.attribution?.source || copy.unknownSource}
              </span>
            </td>
            <td className="px-3 py-3 text-xs text-slate-500">
              {completionTime(row.durationMs, copy)}
            </td>
            <td className="px-3 py-3">
              <FormResponseToggle
                expanded={expanded === row.id}
                copy={copy}
                onClick={() => toggle(row.id)}
              />
            </td>
          </tr>
          {expanded === row.id && (
            <tr>
              <td
                colSpan={5}
                className="bg-slate-50/60 px-3 py-3 dark:bg-white/[0.025]"
              >
                <FormSubmissionDetails locale={locale} response={row} />
              </td>
            </tr>
          )}
        </Fragment>
      )}
    />
  );
}
