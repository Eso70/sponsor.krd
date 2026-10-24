import type { ReactNode } from "react";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { DateTimeInput } from "@/components/shared/DateTimeInput";
import { sharingCopy, type SharingLocale } from "../sharing-copy";

export function ShareExpiryField({
  value,
  date,
  onChange,
  onDateChange,
  locale,
  disabled,
  action,
}: {
  value: string;
  date: string;
  onChange: (value: string) => void;
  onDateChange: (value: string) => void;
  locale: SharingLocale;
  disabled?: boolean;
  action?: ReactNode;
}) {
  const copy = sharingCopy(locale);
  return (
    <div className="min-w-0 flex-1 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <CustomSelect
            label={copy.expiry}
            value={value}
            onChange={onChange}
            disabled={disabled}
            options={[
              { value: "never", label: copy.never },
              { value: "hour", label: copy.hour },
              { value: "day", label: copy.day },
              { value: "week", label: copy.week },
              { value: "month", label: copy.month },
              { value: "custom", label: copy.custom },
            ]}
          />
        </div>
        {action}
      </div>
      {value === "custom" && (
        <DateTimeInput
          label={copy.custom}
          value={date}
          onChange={onDateChange}
          locale={locale}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export function expiryInput(
  value: string,
  date: string,
  locale: SharingLocale,
) {
  return {
    expiry: value,
    locale,
    ...(value === "custom" ? { expiresAt: new Date(date).toISOString() } : {}),
  };
}
