import { Layers3, Library, Plus } from "lucide-react";

import { EditorField } from "@/components/shared/EditorField";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { modalInputClass } from "@/features/link-editor/modal-input-styles";
import type { CampaignAddOnMode } from "../create-campaign-form";
import { CampaignStepIntro } from "./CampaignStepIntro";

export function CampaignInteractiveAddOnsStep({
  enabled,
  mode,
  newAddOnType,
  existingAddOnId,
  onEnabledChange,
  onModeChange,
  onNewAddOnTypeChange,
  onExistingAddOnIdChange,
}: {
  enabled: boolean;
  mode: CampaignAddOnMode;
  newAddOnType: string;
  existingAddOnId: string;
  onEnabledChange: (value: boolean) => void;
  onModeChange: (value: CampaignAddOnMode) => void;
  onNewAddOnTypeChange: (value: string) => void;
  onExistingAddOnIdChange: (value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <CampaignStepIntro
        title="Interactive add-ons"
        description="Add a variety of interactive elements to your ad."
        aside={
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            Optional
          </span>
        }
      />

      <label className="flex cursor-pointer items-start justify-between gap-4 border-b border-slate-200/70 pb-5 dark:border-white/10">
        <span>
          <span className="block text-sm font-bold text-slate-800 dark:text-white">
            Enable interactive add-on
          </span>
          <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
            You can continue and create the campaign without an add-on.
          </span>
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-md border transition ${enabled ? "theme-fill border-transparent text-[var(--theme-ink)]" : "border-slate-300 bg-white text-transparent dark:border-white/20 dark:bg-white/5"}`}
        >
          ✓
        </span>
      </label>

      {enabled ? (
        <div className="space-y-5">
          <SegmentedTabs
            fullWidth
            value={mode}
            onChange={onModeChange}
            tabs={[
              { id: "CREATE", label: "Create new", icon: Plus },
              { id: "EXISTING", label: "Choose existing", icon: Library },
            ]}
          />

          {mode === "CREATE" ? (
            <EditorField label="Add-on type" required>
              <CustomSelect
                label="Add-on type"
                hideLabel
                value={newAddOnType}
                onChange={onNewAddOnTypeChange}
                options={[
                  { value: "DISPLAY_CARD", label: "Display card" },
                  { value: "COUNTDOWN_STICKER", label: "Countdown sticker" },
                  { value: "PRODUCT_CARD", label: "Product card" },
                ]}
                triggerClassName={modalInputClass()}
              />
            </EditorField>
          ) : (
            <EditorField label="Existing add-on" required>
              <CustomSelect
                label="Existing add-on"
                hideLabel
                value={existingAddOnId}
                onChange={onExistingAddOnIdChange}
                options={[
                  { value: "addon-product-card", label: "Main product card" },
                  { value: "addon-seasonal-offer", label: "Seasonal offer" },
                ]}
                triggerClassName={modalInputClass()}
              />
            </EditorField>
          )}

          <div className="flex items-center gap-3 border-y border-slate-200/70 py-4 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
            <Layers3 className="size-4 shrink-0 text-[var(--theme-primary)]" />
            The selected add-on will be attached to this ad creative.
          </div>
        </div>
      ) : null}
    </div>
  );
}
