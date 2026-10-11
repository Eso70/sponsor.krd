import { Search, X } from "lucide-react";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { IconActionButton } from "@/components/shared/IconActionButton";
import type { FormSubmissionFilters } from "../types";
import type { FormsCopy } from "../forms-copy";

export function FormResponseFilters({
  filters,
  onChange,
  copy,
  disabled = false,
}: {
  filters: FormSubmissionFilters;
  onChange: (filters: FormSubmissionFilters) => void;
  copy: FormsCopy;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <ModalTextInput
          disabled={disabled}
          aria-label={copy.responseSearch}
          placeholder={copy.responseSearch}
          maxLength={100}
          className="h-11 !ps-10 !pe-12"
          value={filters.q ?? ""}
          onChange={(event) => onChange({ ...filters, q: event.target.value })}
        />
        {filters.q && (
          <div className="absolute end-2 top-1/2 -translate-y-1/2">
            <IconActionButton
              disabled={disabled}
              label={copy.clearFilters}
              onClick={() => onChange({ pageSize: filters.pageSize })}
            >
              <X className="size-4" />
            </IconActionButton>
          </div>
        )}
      </div>
      <div className="shrink-0 sm:w-52">
        <CustomSelect
          disabled={disabled}
          label={copy.rowsPerPage}
          hideLabel
          triggerLabel={`${filters.pageSize ?? 20} · ${copy.rowsPerPage}`}
          triggerClassName="h-11"
          value={String(filters.pageSize ?? 20)}
          options={[20, 50, 100].map((value) => ({
            value: String(value),
            label: String(value),
          }))}
          searchable={false}
          onChange={(value) =>
            onChange({
              ...filters,
              pageSize: value === "100" ? 100 : value === "50" ? 50 : 20,
            })
          }
        />
      </div>
    </div>
  );
}
