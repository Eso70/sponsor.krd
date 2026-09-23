export const BUSINESS_LANDING_SECTION_IDS = {
  home: "business-home",
  workspace: "business-public-workspace",
} as const;

export const BUSINESS_LANDING_SECTION_HREFS = {
  home: `#${BUSINESS_LANDING_SECTION_IDS.home}`,
  workspace: `#${BUSINESS_LANDING_SECTION_IDS.workspace}`,
} as const;
