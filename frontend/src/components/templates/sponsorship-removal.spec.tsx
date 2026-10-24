import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SpectrumTemplate } from "./SpectrumTemplate";
import { SpotlightTemplate } from "./SpotlightTemplate";
import { FrostTemplate } from "./FrostTemplate";
import { AuroraTemplate } from "./AuroraTemplate";
import { SerenityTemplate } from "./SerenityTemplate";
import { BranchSignalTemplate } from "./BranchSignalTemplate";
import { TEMPLATE_OPTIONS } from "@/lib/templates/config";
import { createLinktreeTemplatePreview } from "./preview-fixtures";

const templates = {
  spectrum: SpectrumTemplate, spotlight: SpotlightTemplate, frost: FrostTemplate,
  aurora: AuroraTemplate, serenity: SerenityTemplate, "branch-signal": BranchSignalTemplate,
};

describe.each([false, true])("removed Linktree sponsorship (preview=%s)", (preview) => {
  it.each(TEMPLATE_OPTIONS)("ignores legacy sponsorship settings in $name while retaining page links", ({ id }) => {
    const Template = templates[id];
    const onClick = vi.fn();
    const { container } = render(
      <Template
        linktree={{
          ...createLinktreeTemplatePreview({ templateId: id }),
          id: preview ? "editor-preview" : "published-page",
          footer_text: "Legacy sponsor button",
          footer_phone: "+9647501111111",
          footer_hidden: false,
        }}
        links={[{ id: "website", platform: "website", url: "https://example.com", display_name: "Visit our website" }]}
        theme={{ from: "#ffffff", via: "#ffffff", to: "#ffffff" }}
        onLinkClick={onClick}
      />,
    );
    expect(container.querySelector("footer")).toHaveAttribute("data-linktree-footer");
    expect(container.querySelector('[data-page-legal-links] a[href*="/legal/privacy"]')).toHaveAttribute("target", "_blank");
    expect(container.querySelector('[data-page-legal-links] a[href*="/legal/terms"]')).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByText("سپۆنسەر کراوە لەلایەن")).not.toBeInTheDocument();
    expect(screen.queryByText("Legacy sponsor button")).not.toBeInTheDocument();
    expect(container.querySelector('a[href*="7501111111"]')).toBeNull();
    fireEvent.click(screen.getByRole("link", { name: /Visit our website/ }));
    expect(onClick).toHaveBeenCalledWith("website", "https://example.com", "website", undefined);
  });
});
