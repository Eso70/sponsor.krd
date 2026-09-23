"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CircleDollarSign,
  HandCoins,
  Pencil,
  ReceiptText,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type {
  CampaignRevenueInput,
  CampaignRevenueRecord,
} from "@linktree/types";
import { DateInput } from "@/components/shared/DateTimeInput";
import { EditorField } from "@/components/shared/EditorField";
import { IconActionButton } from "@/components/shared/IconActionButton";
import { ManagementModal } from "@/components/shared/ManagementModal";
import { ModalFooterActions } from "@/components/shared/ModalFooterActions";
import { modalInputClass } from "@/components/shared/modal-input-styles";
import { NumberInput } from "@/components/shared/NumberInput";
import {
  createCampaignRevenueRecord,
  deleteCampaignRevenueRecord,
  getCampaignRevenueRecords,
  updateCampaignRevenueRecord,
} from "@/features/campaigns/api";

interface CampaignProfitModalProps {
  isOpen: boolean;
  onClose: () => void;
  linktreeId: string;
  apiBasePath: string;
  pageName: string;
  sponsorKrdTheme?: boolean;
  copy?: Partial<CampaignProfitCopy>;
}

export interface CampaignProfitCopy {
  loadFailed: string; saved: string; saveFailed: string; deleted: string; deleteFailed: string;
  title: string; description: string; saveEdit: string; saveAnother: string; close: string;
  editing: string; cancelEdit: string; priceAndDuration: string; adPrice: string;
  adPriceIqd: string; daysCount: string; campaignDays: string; day: string;
  startDate: string; endDate: string; dateHint: string; spendAndRate: string;
  spend: string; spendUsd: string; exchangeRate: string; rateIqd: string;
  convertedSpend: string; netRevenue: string; savedRecords: string; record: string;
  totalRevenue: string; loading: string; empty: string; editRecord: string; deleteRecord: string;
}

const KURDISH_COPY: CampaignProfitCopy = {
  loadFailed: "بارکردنی تۆمارەکانی داهات سەرکەوتوو نەبوو",
  saved: "تۆماری داهات پاشەکەوت کرا",
  saveFailed: "پاشەکەوتکردنی تۆماری داهات سەرکەوتوو نەبوو",
  deleted: "تۆماری داهات سڕایەوە",
  deleteFailed: "سڕینەوەی تۆماری داهات سەرکەوتوو نەبوو",
  title: "داهاتی کەمپەین", description: "هەژمارکردنی داهاتی",
  saveEdit: "پاشەکەوتکردنی دەستکاری", saveAnother: "پاشەکەوتکردن و زیادکردنی دانەیەکی تر",
  close: "داخستن", editing: "تۆمارێکی پێشوو دەستکاری دەکەیت",
  cancelEdit: "هەڵوەشاندنەوە", priceAndDuration: "نرخ و ماوەی ڕیکلام",
  adPrice: "نرخی ڕیکلام", adPriceIqd: "نرخی ڕیکلام بە دیناری عێراقی",
  daysCount: "ژمارەی ڕۆژەکان", campaignDays: "ژمارەی ڕۆژەکانی کەمپەین",
  day: "ڕۆژ", startDate: "بەرواری دەستپێک", endDate: "بەرواری کۆتایی",
  dateHint: "گۆڕینی ژمارەی ڕۆژەکان بەرواری کۆتایی خۆکارانە نوێ دەکاتەوە؛ بەروارەکانیش دەتوانیت بە دەستی بگۆڕیت",
  spendAndRate: "خەرجی کەمپەین و نرخی دۆلار", spend: "خەرجی کەمپەین",
  spendUsd: "خەرجی کەمپەین بە دۆلار", exchangeRate: "نرخی گۆڕینەوە",
  rateIqd: "نرخی گۆڕینەوەی یەک دۆلار بە دینار",
  convertedSpend: "خەرجی گۆڕدراو", netRevenue: "داهاتی پاک",
  savedRecords: "تۆمارە پاشەکەوتکراوەکان", record: "تۆمار",
  totalRevenue: "Total revenue", loading: "تۆمارەکان بار دەکرێن...",
  empty: "هێشتا هیچ داهاتێک پاشەکەوت نەکراوە",
  editRecord: "دەستکاریکردنی تۆماری داهات", deleteRecord: "سڕینەوەی تۆماری داهات",
};

function formatDateOnly(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addDays(value: string, days: number): string {
  const start = parseDateOnly(value);
  if (!start) return value;
  start.setDate(start.getDate() + Math.max(0, Math.round(days)));
  return formatDateOnly(start);
}

function daysBetween(startValue: string, endValue: string): number {
  const start = parseDateOnly(startValue);
  const end = parseDateOnly(endValue);
  if (!start || !end) return 0;
  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(0, Math.round((endUtc - startUtc) / 86_400_000));
}

function formatIqd(value: number): string {
  return `${Math.round(value).toLocaleString("en-US")} IQD`;
}

function formatUsd(value: number): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} USD`;
}

export function CampaignProfitModal({
  isOpen,
  onClose,
  linktreeId,
  apiBasePath,
  pageName,
  sponsorKrdTheme = false,
  copy,
}: CampaignProfitModalProps) {
  const labels = { ...KURDISH_COPY, ...copy };
  const today = formatDateOnly(new Date());
  const [advertisementPriceIqd, setAdvertisementPriceIqd] = useState(0);
  const [durationDays, setDurationDays] = useState(0);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");
  const [campaignSpendUsd, setCampaignSpendUsd] = useState(0);
  const [usdToIqdRate, setUsdToIqdRate] = useState(0);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [records, setRecords] = useState<CampaignRevenueRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [formRevision, setFormRevision] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    void getCampaignRevenueRecords(
      apiBasePath,
      linktreeId,
      controller.signal,
    )
      .then(setRecords)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        toast.error(labels.loadFailed);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [apiBasePath, isOpen, linktreeId, labels.loadFailed]);

  const campaignSpendIqd = campaignSpendUsd * usdToIqdRate;
  const netRevenueIqd = advertisementPriceIqd - campaignSpendIqd;
  const totalRevenueIqd = records.reduce(
    (total, record) => total + record.netRevenueIqd,
    0,
  );
  const canSave =
    advertisementPriceIqd > 0 &&
    Boolean(startDate) &&
    Boolean(endDate) &&
    endDate >= startDate;

  const updateDuration = (days: number) => {
    const normalizedDays = Math.max(0, Math.round(days));
    setDurationDays(normalizedDays);
    setEndDate(
      startDate && normalizedDays > 0 ? addDays(startDate, normalizedDays) : "",
    );
  };

  const updateStartDate = (value: string) => {
    setStartDate(value);
    setEndDate(
      value && durationDays > 0 ? addDays(value, durationDays) : "",
    );
  };

  const updateEndDate = (value: string) => {
    setEndDate(value);
    if (value) setDurationDays(daysBetween(startDate, value));
  };

  const resetForm = () => {
    setAdvertisementPriceIqd(0);
    setCampaignSpendUsd(0);
    setUsdToIqdRate(0);
    setDurationDays(0);
    setStartDate(formatDateOnly(new Date()));
    setEndDate("");
    setEditingRecordId(null);
    setFormRevision((current) => current + 1);
  };

  const saveRecord = async () => {
    if (!canSave || isSaving) return;
    const input: CampaignRevenueInput = {
      advertisementPriceIqd,
      startDate,
      endDate,
      campaignSpendUsd,
      usdToIqdRate,
    };
    setIsSaving(true);
    try {
      if (editingRecordId) {
        const updated = await updateCampaignRevenueRecord(
          apiBasePath,
          linktreeId,
          editingRecordId,
          input,
        );
        setRecords((current) =>
          current.map((record) =>
            record.id === updated.id ? updated : record,
          ),
        );
      } else {
        const created = await createCampaignRevenueRecord(
          apiBasePath,
          linktreeId,
          input,
        );
        setRecords((current) => [...current, created]);
      }
      resetForm();
      toast.success(labels.saved);
    } catch {
      toast.error(labels.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRecord = async (recordId: string) => {
    if (deletingRecordId) return;
    setDeletingRecordId(recordId);
    try {
      await deleteCampaignRevenueRecord(apiBasePath, linktreeId, recordId);
      setRecords((current) =>
        current.filter((record) => record.id !== recordId),
      );
      if (editingRecordId === recordId) resetForm();
      toast.success(labels.deleted);
    } catch {
      toast.error(labels.deleteFailed);
    } finally {
      setDeletingRecordId(null);
    }
  };

  const editRecord = (record: CampaignRevenueRecord) => {
    setFormRevision((current) => current + 1);
    setEditingRecordId(record.id);
    setAdvertisementPriceIqd(record.advertisementPriceIqd);
    setDurationDays(record.durationDays);
    setStartDate(record.startDate);
    setEndDate(record.endDate);
    setCampaignSpendUsd(record.campaignSpendUsd);
    setUsdToIqdRate(record.usdToIqdRate);
  };

  return (
    <ManagementModal
      isOpen={isOpen}
      onClose={onClose}
      title={labels.title}
      description={`${labels.description} ${pageName}`}
      sponsorKrdTheme={sponsorKrdTheme}
      wide
      busy={isSaving || deletingRecordId !== null}
      footer={
        <ModalFooterActions
          submitLabel={
            editingRecordId
              ? labels.saveEdit
              : labels.saveAnother
          }
          submitDisabled={!canSave}
          isSubmitting={isSaving}
          cancelLabel={labels.close}
          onCancel={onClose}
          onSubmit={() => void saveRecord()}
        />
      }
    >
      <div className="space-y-5" dir="rtl">
        {editingRecordId ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <span>{labels.editing}</span>
            <button
              type="button"
              onClick={resetForm}
              className="shrink-0 rounded-lg px-2.5 py-1.5 font-bold transition hover:bg-amber-500/15"
            >
              {labels.cancelEdit}
            </button>
          </div>
        ) : null}
        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/5 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-200">
              {labels.priceAndDuration}
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <EditorField label={labels.adPrice}>
              <div className="relative" dir="ltr">
                <NumberInput
                  key={`advertisement-price-${formRevision}`}
                  value={advertisementPriceIqd}
                  onValueChange={setAdvertisementPriceIqd}
                  min={0}
                  step={1}
                  hideSteppers
                  clearOnFocus
                  aria-label={labels.adPriceIqd}
                  className={modalInputClass(false, "pr-14")}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400">
                  IQD
                </span>
              </div>
            </EditorField>

            <EditorField label={labels.daysCount}>
              <div className="relative" dir="ltr">
                <NumberInput
                  key={`duration-${formRevision}`}
                  value={durationDays}
                  onValueChange={updateDuration}
                  min={0}
                  step={1}
                  hideSteppers
                  clearOnFocus
                  aria-label={labels.campaignDays}
                  className={modalInputClass(false, "pr-12")}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400">
                  {labels.day}
                </span>
              </div>
            </EditorField>

            <DateInput
              key={`start-${startDate}`}
              label={labels.startDate}
              value={startDate}
              onChange={updateStartDate}
              required
            />
            <DateInput
              key={`end-${endDate}`}
              label={labels.endDate}
              value={endDate}
              min={startDate}
              onChange={updateEndDate}
              required
            />
          </div>

          <p className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" />
            {labels.dateHint}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#161b22] sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 text-sky-500" />
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-200">
              {labels.spendAndRate}
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <EditorField label={labels.spend}>
              <div className="relative" dir="ltr">
                <NumberInput
                  key={`campaign-spend-${formRevision}`}
                  value={campaignSpendUsd}
                  onValueChange={setCampaignSpendUsd}
                  min={0}
                  step={0.01}
                  hideSteppers
                  clearOnFocus
                  aria-label={labels.spendUsd}
                  className={modalInputClass(false, "pr-14")}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400">
                  USD
                </span>
              </div>
            </EditorField>

            <EditorField label={labels.exchangeRate} hint="1 USD">
              <div className="relative" dir="ltr">
                <NumberInput
                  key={`exchange-rate-${formRevision}`}
                  value={usdToIqdRate}
                  onValueChange={setUsdToIqdRate}
                  min={0}
                  step={1}
                  hideSteppers
                  clearOnFocus
                  aria-label={labels.rateIqd}
                  className={modalInputClass(false, "pr-14")}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400">
                  IQD
                </span>
              </div>
            </EditorField>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
          <div className="grid gap-px bg-slate-200 dark:bg-white/10 sm:grid-cols-3">
            <div className="bg-white p-4 dark:bg-[#1c222b]">
              <p className="text-[11px] font-semibold text-slate-400">
                {labels.adPrice}
              </p>
              <bdi className="mt-1 block text-base font-black text-slate-700 dark:text-slate-200">
                {formatIqd(advertisementPriceIqd)}
              </bdi>
            </div>
            <div className="bg-white p-4 dark:bg-[#1c222b]">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <RefreshCw className="h-3 w-3" />
                {labels.convertedSpend}
              </p>
              <bdi
                data-testid="campaign-spend-iqd"
                className="mt-1 block text-base font-black text-rose-600 dark:text-rose-400"
              >
                {formatIqd(campaignSpendIqd)}
              </bdi>
            </div>
            <div className="bg-emerald-500/10 p-4 dark:bg-emerald-500/10">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                <HandCoins className="h-3.5 w-3.5" />
                {labels.netRevenue}
              </p>
              <bdi
                data-testid="net-revenue-iqd"
                className={`mt-1 block text-xl font-black ${netRevenueIqd >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}
              >
                {formatIqd(netRevenueIqd)}
              </bdi>
            </div>
          </div>
          <p
            className="bg-slate-50 px-4 py-3 text-center text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400"
            dir="ltr"
          >
            {formatIqd(advertisementPriceIqd)} − ({formatUsd(campaignSpendUsd)} ×{" "}
            {usdToIqdRate.toLocaleString("en-US")}) = {formatIqd(netRevenueIqd)}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#161b22] sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-200">
                {labels.savedRecords}
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">
                {records.length.toLocaleString("en-US")} {labels.record}
              </p>
            </div>
            <div className="text-left" dir="ltr">
              <p className="text-[10px] font-semibold text-slate-400">
                {labels.totalRevenue}
              </p>
              <bdi
                data-testid="total-revenue-iqd"
                className={`text-lg font-black ${totalRevenueIqd >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}
              >
                {formatIqd(totalRevenueIqd)}
              </bdi>
            </div>
          </div>

          {isLoading ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400 dark:border-white/10">
              {labels.loading}
            </p>
          ) : records.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400 dark:border-white/10">
              {labels.empty}
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-white/5 dark:border-white/10">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 bg-slate-50/50 p-3 dark:bg-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-200" dir="ltr">
                      {record.startDate} → {record.endDate}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-slate-400" dir="ltr">
                      {formatIqd(record.advertisementPriceIqd)} − {formatIqd(record.campaignSpendIqd)}
                    </p>
                  </div>
                  <bdi
                    className={`shrink-0 text-sm font-black ${record.netRevenueIqd >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}
                  >
                    {formatIqd(record.netRevenueIqd)}
                  </bdi>
                  <IconActionButton
                    label={labels.editRecord}
                    onClick={() => editRecord(record)}
                    disabled={deletingRecordId !== null || isSaving}
                  >
                    <Pencil className="h-4 w-4" />
                  </IconActionButton>
                  <IconActionButton
                    label={labels.deleteRecord}
                    tone="danger"
                    disabled={deletingRecordId !== null || isSaving}
                    onClick={() => void deleteRecord(record.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconActionButton>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </ManagementModal>
  );
}
