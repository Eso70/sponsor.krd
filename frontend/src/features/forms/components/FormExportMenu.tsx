import { CalendarRange, FileText } from "lucide-react";
import { CustomSelect } from "@/components/shared/CustomSelect";
import type { FormsCopy } from "../forms-copy";

export function FormExportMenu({
  copy,
  disabled,
  onExport,
  onExportRange,
}: {
  copy: FormsCopy;
  disabled: boolean;
  onExport: () => void;
  onExportRange: () => void;
}) {
  return (
    <CustomSelect<"" | "csv" | "range">
      label={copy.exportData}
      ariaLabel={copy.exportData}
      hideLabel
      value=""
      allowEmptySelection
      triggerLabel={copy.exportData}
      disabled={disabled}
      fullWidth={false}
      minMenuWidth={170}
      triggerClassName="!h-9 !rounded-lg !px-3 !py-0 !text-xs"
      options={[
        { value: "csv", label: copy.exportCsv, icon: FileText },
        { value: "range", label: copy.exportRange, icon: CalendarRange },
      ]}
      onChange={(format) => {
        if (format === "range") onExportRange();
        else if (format) onExport();
      }}
    />
  );
}
