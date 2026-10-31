import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DynamicTemplate } from "../DynamicTemplate";
import { PublicLinktreeLocaleProvider } from "@/features/business/i18n/public-linktree";
import { TEMPLATE_OPTIONS } from "@/lib/templates/config";

describe("sponsor configuration across Linktree templates", () => {
  it.each(TEMPLATE_OPTIONS.map((template) => template.id))("renders saved attribution in the %s public page", async (templateKey) => {
    render(<PublicLinktreeLocaleProvider locale="ckb">
      <DynamicTemplate
        linktree={{ id: "saved-page", uid: "test", name: "Page", background_color: "#ffffff",
          template_config: { templateKey, sponsor: { enabled: true, style: "text", name: "Acme Sponsor", logo: null, url: "https://example.com/" } } }}
        links={[]} theme={{ from: "#ffffff", via: "#ffffff", to: "#ffffff", text: "#333333" }} onLinkClick={vi.fn()} />
    </PublicLinktreeLocaleProvider>);
    expect(await screen.findByText("سپۆنسەرکراوە لەلایەن", {}, { timeout: 15_000 })).toBeVisible();
    expect(screen.getByRole("link", { name: "Acme Sponsor" })).toHaveAttribute("href", "https://example.com/");
    expect(screen.getByRole("link", { name: "Terms" })).toBeVisible();
  }, 20_000);
});
