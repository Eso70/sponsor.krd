import type {
  CreateCampaignFormState,
} from "./create-campaign-form";
import type { TikTokApiPayloadBundle } from "./types";

/**
 * Builds the exact TikTok Marketing API v2.0 JSON structures
 * for Campaign, Ad Group, and Ad (Spark Ad using Creator Video Code).
 */
export function buildTikTokApiPayload(
  form: CreateCampaignFormState,
  advertiserId = "7123456789012345678",
  campaignId = "1809283746152431",
  adgroupId = "1809284920192831",
): TikTokApiPayloadBundle {
  // Map internal objective to official TikTok Marketing API v2.0 objective
  let objectiveType = "REACH";
  let optimizationGoal = "REACH";
  let externalAction: string | undefined = undefined;
  let frequency: number | undefined = undefined;
  let frequencySchedule: number | undefined = undefined;

  switch (form.objective) {
    case "WEBSITE_LEAD":
      objectiveType = "LEAD_GENERATION";
      optimizationGoal = "LEAD";
      externalAction = form.optimizationEvent || "SUBMIT_FORM";
      break;
    case "SALES":
      objectiveType = "WEB_CONVERSIONS";
      optimizationGoal = "CONVERSIONS";
      externalAction = form.optimizationEvent || "COMPLETE_PAYMENT";
      break;
    case "VIDEO_VIEWS":
      objectiveType = "VIDEO_VIEWS";
      optimizationGoal = "VIDEO_VIEW_IN_6S";
      break;
    case "REACH":
    default:
      objectiveType = "REACH";
      optimizationGoal = "REACH";
      frequency = 2;
      frequencySchedule = 7;
      break;
  }

  // 1. Campaign Level
  const campaignPayload = {
    advertiser_id: advertiserId,
    campaign_name: form.campaignName || "TikTok Campaign",
    objective_type: objectiveType,
    budget_mode: "BUDGET_MODE_DAY",
    budget: Number(form.dailyBudget) || 25,
    budget_optimize_on: form.objective === "SALES",
  };

  // 2. Ad Group Level
  const adgroupPayload: TikTokApiPayloadBundle["adgroup"] = {
    advertiser_id: advertiserId,
    campaign_id: campaignId,
    adgroup_name: `${form.campaignName || "Campaign"} - AdGroup`,
    placement_type: "PLACEMENT_TYPE_NORMAL",
    placements: ["PLACEMENT_TIKTOK"], // Spark ads require TikTok native placement
    optimization_goal: optimizationGoal,
    bid_type: "BID_TYPE_NO_BID", // Maximize delivery
    budget_mode: "BUDGET_MODE_DAY",
    budget: Number(form.dailyBudget) || 25,
    schedule_type:
      form.scheduleType === "START_NOW" ? "SCHEDULE_FROM_NOW" : "SCHEDULE_START_END",
    schedule_start_time: form.startDate ? `${form.startDate} 00:00:00` : undefined,
    schedule_end_time: form.endDate ? `${form.endDate} 23:59:59` : undefined,
    pacing: "PACING_MODE_SMOOTH",
    ...(externalAction ? { external_action: externalAction } : {}),
    ...(form.dataConnectionId ? { pixel_id: form.dataConnectionId } : {}),
    ...(frequency !== undefined ? { frequency, frequency_schedule: frequencySchedule } : {}),
    targeting: {
      location_ids: ["6252001"], // Iraq / Kurdistan default target
      gender:
        form.gender === "MALE"
          ? "GENDER_MALE"
          : form.gender === "FEMALE"
            ? "GENDER_FEMALE"
            : "GENDER_UNLIMITED",
      age_groups: form.ageGroups.map((age) => `AGE_${age.replace("-", "_")}`),
      languages: form.languages
        ? form.languages.split(",").map((lang) => lang.trim().toLowerCase())
        : [],
    },
  };

  // 3. Ad Level (Spark Ad using Creator Video Code)
  const adPayload: TikTokApiPayloadBundle["ad"] = {
    advertiser_id: advertiserId,
    adgroup_id: adgroupId,
    ad_name: `${form.campaignName || "Campaign"} - Spark Ad`,
    ad_format: "SINGLE_VIDEO",
    identity_type: "AUTH_CODE",
    auth_code: form.videoCode || "BYTEDANCE_AUTH_CODE_SAMPLE",
    call_to_action: form.callToAction || "LEARN_MORE",
    landing_page_url: form.destinationUrl || "https://sponsor.krd",
    click_jump_type: "CUSTOM",
    ...(form.interactiveAddOnEnabled
      ? {
          interactive_add_ons: [
            {
              addon_type: form.newAddOnType || "DISPLAY_CARD",
              value: form.addOnMode === "EXISTING" ? form.existingAddOnId : "NEW_PROMO",
            },
          ],
        }
      : {}),
  };

  return {
    campaign: campaignPayload,
    adgroup: adgroupPayload,
    ad: adPayload,
  };
}
