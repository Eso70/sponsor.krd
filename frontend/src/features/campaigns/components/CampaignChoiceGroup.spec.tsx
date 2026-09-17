import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CampaignChoiceGroup } from "@/features/campaigns/components/CampaignChoiceGroup";

describe("CampaignChoiceGroup", () => {
  it("uses the non-repeating shared theme fill for the selected indicator", () => {
    render(
      <CampaignChoiceGroup
        value="active"
        options={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
        onChange={vi.fn()}
      />,
    );

    const selected = screen.getByRole("radio", { name: "Active" });
    expect(selected.querySelector(".theme-fill")).toBeInTheDocument();
    expect(
      screen
        .getByRole("radio", { name: "Inactive" })
        .querySelector(".theme-fill"),
    ).toBeNull();
  });
});
