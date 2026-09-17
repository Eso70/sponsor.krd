import { EditorField } from "@/components/shared/EditorField";
import { NumberInput } from "@/components/shared/NumberInput";
import { modalInputClass } from "@/features/link-editor/modal-input-styles";
import type { CampaignScheduleType } from "../create-campaign-form";
import { CampaignChoiceField } from "./CampaignChoiceField";
import { CampaignChoiceGroup } from "./CampaignChoiceGroup";
import { CampaignStepIntro } from "./CampaignStepIntro";

const SCHEDULE_OPTIONS = [
  {
    value: "START_NOW",
    label: "Start immediately",
    description: "دوای پەسەندکردن دەست پێ بکات",
  },
  {
    value: "DATE_RANGE",
    label: "Set a date range",
    description: "ڕێکەوتی دەستپێک و کۆتایی دیاری بکە",
  },
] as const;

export function CampaignBudgetScheduleStep({
  dailyBudget,
  scheduleType,
  startDate,
  endDate,
  onDailyBudgetChange,
  onScheduleTypeChange,
  onStartDateChange,
  onEndDateChange,
}: {
  dailyBudget: number;
  scheduleType: CampaignScheduleType;
  startDate: string;
  endDate: string;
  onDailyBudgetChange: (value: number) => void;
  onScheduleTypeChange: (value: CampaignScheduleType) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <CampaignStepIntro
        title="Budget and schedule"
        description="بودجەی ڕۆژانە و کاتی بەڕێوەچوونی کەمپەینەکە ڕێک بخە"
      />

      <EditorField label="Daily budget" hint="USD · minimum $5" required>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-400">
            $
          </span>
          <NumberInput
            value={dailyBudget}
            onValueChange={onDailyBudgetChange}
            min={5}
            step={1}
            clearOnFocus
            aria-label="Daily budget"
            className={modalInputClass(false, "pl-8 font-mono")}
          />
        </div>
      </EditorField>

      <CampaignChoiceField label="Schedule" required>
        <CampaignChoiceGroup
          value={scheduleType}
          options={SCHEDULE_OPTIONS}
          onChange={onScheduleTypeChange}
        />
      </CampaignChoiceField>

      {scheduleType === "DATE_RANGE" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <EditorField label="Start date" required>
            <input
              type="date"
              value={startDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              className={modalInputClass()}
            />
          </EditorField>
          <EditorField label="End date" required>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => onEndDateChange(event.target.value)}
              className={modalInputClass()}
            />
          </EditorField>
        </div>
      ) : null}
    </div>
  );
}
