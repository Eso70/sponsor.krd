import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SpectrumTemplate } from "./SpectrumTemplate";
import { SpotlightTemplate } from "./SpotlightTemplate";
import { FrostTemplate } from "./FrostTemplate";
import { AuroraTemplate } from "./AuroraTemplate";
import { SerenityTemplate } from "./SerenityTemplate";
import { BranchSignalTemplate } from "./BranchSignalTemplate";
import { TEMPLATE_OPTIONS } from "@/lib/templates/config";
import { createLinktreeTemplatePreview } from "./preview-fixtures";

const templates = { spectrum: SpectrumTemplate, spotlight: SpotlightTemplate, frost: FrostTemplate,
  aurora: AuroraTemplate, serenity: SerenityTemplate, "branch-signal": BranchSignalTemplate };

describe("public Linktree verification badge", () => {
  it.each(TEMPLATE_OPTIONS)("refreshes appearance and click handlers alongside the badge in $name", ({ id }) => {
    const Template = templates[id];
    const linktree = createLinktreeTemplatePreview({ templateId: id });
    const oldClick = vi.fn();
    const newClick = vi.fn();
    const props = { theme: { from: "#ffffff", via: "#ffffff", to: "#ffffff" },
      links: [{ id: "website-link", platform: "website", url: "https://example.com", display_name: "Visit our website" }] };
    const { rerender } = render(<Template {...props} linktree={linktree} onLinkClick={oldClick} />);
    rerender(<Template {...props} linktree={{ ...linktree, subtitle: "Updated subtitle", subtitle_color: "#123456",
      description: "Updated description", footer_hidden: true,
      template_config: { ...linktree.template_config, verification_badge: true } }} onLinkClick={newClick} />);
    expect(screen.getByText("Updated subtitle")).toHaveStyle({ color: "#123456" });
    expect(screen.getByText("Updated description")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Sponsor.krd" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "نیشانەی پشتڕاستکردنەوە" })).toBeVisible();
    fireEvent.click(screen.getByRole("link", { name: /Visit our website/ }));
    expect(newClick).toHaveBeenCalledWith("website-link", "https://example.com", "website", undefined);
    expect(oldClick).not.toHaveBeenCalled();
  });

  it.each(TEMPLATE_OPTIONS)("is optional beside the name in $name", ({ id }) => {
    const linktree = createLinktreeTemplatePreview({ templateId: id });
    const Template = templates[id];
    const props = { links: [], theme: { from: "#ffffff", via: "#ffffff", to: "#ffffff" }, onLinkClick: vi.fn() };
    const { rerender } = render(<Template {...props} linktree={linktree} />);
    const badgeName = "نیشانەی پشتڕاستکردنەوە";
    expect(screen.queryByRole("img", { name: badgeName })).not.toBeInTheDocument();
    rerender(<Template {...props} linktree={{ ...linktree, template_config: { ...linktree.template_config, verification_badge: true } }} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(within(heading).getByRole("img", { name: badgeName })).toBeVisible();
    rerender(<Template {...props} linktree={{ ...linktree, template_config: { ...linktree.template_config, verification_badge: false } }} />);
    expect(screen.queryByRole("img", { name: badgeName })).not.toBeInTheDocument();
  });
});
