export type CampaignStatus = "active" | "paused" | "review" | "completed";

export type CampaignObjective =
  "REACH" | "VIDEO_VIEWS" | "WEBSITE_LEAD" | "SALES";

export type CampaignOptimizationGoal =
  | "LEADS"
  | "WEB_ENGAGEMENT"
  | "CONVERSIONS"
  | "CLICKS"
  | "REACH"
  | "VIDEO_VIEW_IN_6S"
  | "VIDEO_VIEW_IN_2S"
  | "VALUE";

export type CampaignBidStrategy = "MAXIMIZE_DELIVERY";
export type CampaignPlacement = "AUTOMATIC" | "TIKTOK_ONLY" | "SELECTED";

export interface TikTokAdAccount {
  id: string;
  advertiserId: string;
  advertiserName: string;
  currency: string;
  timezone: string;
  balance?: number;
  dailySpendCap?: number;
  status: "connected" | "disconnected" | "action_required";
  connectedPixelId?: string;
  connectedPixelName?: string;
  lastSyncedAt: string;
  accountType?: "SANDBOX" | "AUCTION";
  connectionMethod?: "direct_token" | "oauth";
  accessToken?: string;
  businessCenterId?: string;
  companyName?: string;
  appId?: string;
}

export interface TikTokApiPayloadBundle {
  campaign: {
    advertiser_id: string;
    campaign_name: string;
    objective_type: string;
    budget_mode: string;
    budget: number;
    budget_optimize_on: boolean;
  };
  adgroup: {
    advertiser_id: string;
    campaign_id: string;
    adgroup_name: string;
    placement_type: string;
    placements: string[];
    optimization_goal: string;
    bid_type: string;
    budget_mode: string;
    budget: number;
    schedule_type: string;
    schedule_start_time?: string;
    schedule_end_time?: string;
    pacing: string;
    pixel_id?: string;
    external_action?: string;
    frequency?: number;
    frequency_schedule?: number;
    targeting: {
      location_ids: string[];
      gender: string;
      age_groups: string[];
      languages: string[];
    };
  };
  ad: {
    advertiser_id: string;
    adgroup_id: string;
    ad_name: string;
    ad_format: string;
    identity_type: string;
    identity_id?: string;
    item_id?: string;
    auth_code?: string;
    call_to_action: string;
    landing_page_url: string;
    click_jump_type: string;
    interactive_add_ons?: Array<{
      addon_type: string;
      [key: string]: unknown;
    }>;
  };
}

export interface TikTokCampaign {
  id: string;
  name: string;
  adGroupName?: string;
  adName?: string;
  video: {
    title: string;
    duration: string;
    format: "9:16" | "1:1" | "16:9";
    resolution: string;
    tone: "cyan" | "violet" | "orange" | "rose";
  };
  objective: CampaignObjective;
  status: CampaignStatus;
  dailyBudget: number;
  totalSpent: number;
  impressions: number;
  clicks: number;
  ctr: number; // percentage (e.g. 3.42)
  cpc: number; // cost per click ($)
  conversions: number;
  destinationPage: {
    id: string;
    title: string;
    slug: string;
    type: "linktree" | "website";
    url?: string;
  };
  targetAudience: {
    location: string;
    gender: "ALL" | "MALE" | "FEMALE";
    ageGroups: string[];
    languages: string[];
  };
  callToAction: string;
  setup?: {
    optimizationGoal: CampaignOptimizationGoal;
    dataConnectionId?: string;
    optimizationEvent?: string;
    bidStrategy: CampaignBidStrategy;
    scheduleType: "START_NOW" | "DATE_RANGE";
    startDate: string;
    endDate: string;
    placement: CampaignPlacement;
    destinationUrl: string;
    videoCode: string;
    adText: string;
    interactiveAddOn?: {
      mode: "CREATE" | "EXISTING";
      value: string;
    };
  };
  tiktokPayload?: TikTokApiPayloadBundle;
  createdAt: string;
  updatedAt: string;
}

