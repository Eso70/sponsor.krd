import {
  CustomSelect,
  type CustomSelectOption,
} from "@/components/shared/CustomSelect";
import type {
  CampaignBidStrategy,
  CampaignObjective,
  CampaignOptimizationGoal,
} from "../types";
import { CampaignStepIntro } from "./CampaignStepIntro";

const OPTIMIZATION_OPTIONS: CustomSelectOption<CampaignOptimizationGoal>[] = [
  { value: "LEADS", label: "Leads" },
  { value: "WEB_ENGAGEMENT", label: "Website engagements" },
  { value: "CONVERSIONS", label: "Conversions" },
  { value: "CLICKS", label: "Click" },
  { value: "REACH", label: "Reach" },
  { value: "VIDEO_VIEW_IN_6S", label: "Focused 6s video views" },
  { value: "VALUE", label: "Value / ROAS" },
];

const DATA_CONNECTION_OPTIONS: CustomSelectOption<string>[] = [
  { value: "ismail-cs", label: "Ismail CS" },
  { value: "sponsor-krd-main", label: "Sponsor.krd Main" },
];

const OPTIMIZATION_EVENT_OPTIONS: CustomSelectOption<string>[] = [
  { value: "ClickButton", label: "Click button" },
  { value: "ViewContent", label: "View content" },
  { value: "Contact", label: "Contact" },
  { value: "AddPaymentInfo", label: "Add payment info" },
  { value: "AddToCart", label: "Add to cart" },
  { value: "Purchase", label: "Purchase" },
];

const BID_STRATEGY_OPTIONS: CustomSelectOption<CampaignBidStrategy>[] = [
  { value: "MAXIMIZE_DELIVERY", label: "Maximize delivery" },
];

export function CampaignOptimizationStep({
  objective,
  optimizationGoal,
  dataConnectionId,
  optimizationEvent,
  bidStrategy,
  onOptimizationGoalChange,
  onDataConnectionIdChange,
  onOptimizationEventChange,
}: {
  objective: CampaignObjective;
  optimizationGoal: CampaignOptimizationGoal;
  dataConnectionId: string;
  optimizationEvent: string;
  bidStrategy: CampaignBidStrategy;
  onOptimizationGoalChange: (value: CampaignOptimizationGoal) => void;
  onDataConnectionIdChange: (value: string) => void;
  onOptimizationEventChange: (value: string) => void;
}) {
  const usesWebsiteData = objective === "WEBSITE_LEAD" || objective === "SALES";

  return (
    <div className="space-y-5">
      <CampaignStepIntro
        title="Optimization and bidding"
        description="Optimize your ad group for maximum performance and budget efficiency."
      />

      <CustomSelect
        label="Optimization goal"
        value={optimizationGoal}
        options={OPTIMIZATION_OPTIONS}
        onChange={onOptimizationGoalChange}
        required
        showRequirement
        triggerClassName="h-11"
      />

      {usesWebsiteData ? (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-black text-slate-600 dark:text-slate-300">
              Optimization location
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Choose where you want audiences to take action or convert.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              Website
            </p>
          </div>

          <div className="space-y-4 rounded-xl bg-slate-50/80 p-4 dark:bg-white/[0.035]">
            <div>
              <CustomSelect
                label="Data connection"
                value={dataConnectionId}
                options={DATA_CONNECTION_OPTIONS}
                onChange={onDataConnectionIdChange}
                required
                showRequirement
                triggerClassName="h-11"
              />
              <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                Select where you want to track events from your ads. Data
                connections are managed in Events Manager.
              </p>
            </div>

            <CustomSelect
              label="Optimization event"
              value={optimizationEvent}
              options={OPTIMIZATION_EVENT_OPTIONS}
              onChange={onOptimizationEventChange}
              required
              showRequirement
              triggerClassName="h-11"
            />
          </div>
        </div>
      ) : null}

      <CustomSelect
        label="Bid strategy"
        value={bidStrategy}
        options={BID_STRATEGY_OPTIONS}
        onChange={() => undefined}
        disabled
        triggerClassName="h-11"
      />
    </div>
  );
}
