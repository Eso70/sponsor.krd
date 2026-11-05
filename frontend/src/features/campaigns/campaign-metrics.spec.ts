import { describe, expect, it } from "vitest";

import {
  calculateConversionRate,
  calculateCostPerConversion,
  formatConversionRate,
  formatCostPerConversion,
  campaignReportedValue,
} from "./campaign-metrics";

describe("campaign conversion metrics", () => {
  it("does not publish locally stored campaign numbers as live reporting", () => {
    expect(campaignReportedValue(48920)).toBe("—");
    expect(campaignReportedValue("$165.40")).toBe("—");
  });

  it("derives cost per conversion from spend and conversions", () => {
    expect(
      calculateCostPerConversion({ totalSpent: 165.4, conversions: 245 }),
    ).toBeCloseTo(0.6751, 4);
    expect(
      formatCostPerConversion({ totalSpent: 165.4, conversions: 245 }),
    ).toBe("$0.68");
  });

  it("does not divide by zero when a campaign has no conversions", () => {
    expect(
      calculateCostPerConversion({ totalSpent: 20, conversions: 0 }),
    ).toBeNull();
    expect(formatCostPerConversion({ totalSpent: 20, conversions: 0 })).toBe(
      "—",
    );
  });

  it("derives the conversion rate from clicks and conversions", () => {
    expect(
      calculateConversionRate({ clicks: 3410, conversions: 245 }),
    ).toBeCloseTo(7.1848, 4);
    expect(formatConversionRate({ clicks: 3410, conversions: 245 })).toBe(
      "7.18%",
    );
  });

  it("does not divide by zero when a campaign has no clicks", () => {
    expect(calculateConversionRate({ clicks: 0, conversions: 0 })).toBeNull();
    expect(formatConversionRate({ clicks: 0, conversions: 0 })).toBe("—");
  });
});
