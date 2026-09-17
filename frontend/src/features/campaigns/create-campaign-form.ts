import type {
  CampaignBidStrategy,
  CampaignObjective,
  CampaignOptimizationGoal,
  CampaignPlacement,
} from "./types";

export type CampaignWizardStep = "setup" | "delivery" | "creative";

export type CampaignScheduleType = "START_NOW" | "DATE_RANGE";
export type CampaignGender = "ALL" | "MALE" | "FEMALE";
export type CampaignAddOnMode = "CREATE" | "EXISTING";

export interface CreateCampaignFormState {
  campaignName: string;
  objective: CampaignObjective;
  optimizationGoal: CampaignOptimizationGoal;
  dataConnectionId: string;
  optimizationEvent: string;
  bidStrategy: CampaignBidStrategy;
  dailyBudget: number;
  scheduleType: CampaignScheduleType;
  startDate: string;
  endDate: string;
  location: string;
  gender: CampaignGender;
  ageGroups: string[];
  languages: string;
  placement: CampaignPlacement;
  destinationUrl: string;
  videoCode: string;
  adText: string;
  callToAction: string;
  interactiveAddOnEnabled: boolean;
  addOnMode: CampaignAddOnMode;
  newAddOnType: string;
  existingAddOnId: string;
}

export const CAMPAIGN_WIZARD_STEPS: ReadonlyArray<{
  id: CampaignWizardStep;
  label: string;
}> = [
  { id: "setup", label: "ڕێکخستن" },
  { id: "delivery", label: "گەیاندن" },
  { id: "creative", label: "ڕیکلام" },
];

export const INITIAL_CREATE_CAMPAIGN_FORM: CreateCampaignFormState = {
  campaignName: "",
  objective: "REACH",
  optimizationGoal: "LEADS",
  dataConnectionId: "ismail-cs",
  optimizationEvent: "ClickButton",
  bidStrategy: "MAXIMIZE_DELIVERY",
  dailyBudget: 25,
  scheduleType: "START_NOW",
  startDate: "",
  endDate: "",
  location: "هەولێر، سلێمانی، دهۆک",
  gender: "ALL",
  ageGroups: ["18-24", "25-34"],
  languages: "Kurdish, Arabic",
  placement: "AUTOMATIC",
  destinationUrl: "https://sponsor.krd/",
  videoCode: "",
  adText: "",
  callToAction: "LEARN_MORE",
  interactiveAddOnEnabled: false,
  addOnMode: "CREATE",
  newAddOnType: "DISPLAY_CARD",
  existingAddOnId: "addon-product-card",
};

export function isValidWebsiteUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
