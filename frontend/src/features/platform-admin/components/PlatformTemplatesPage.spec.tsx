import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { arabicTemplatesPageCopy } from "@/features/templates/arabic-copy";
import { PlatformTemplatesPage } from "./PlatformTemplatesPage";

vi.mock("@/features/templates/components/TemplatesPage", () => ({
  TemplatesPage: ({ copy }: { copy?: { title: string; searchPrompt: string } }) => (
    <div data-testid="catalogue" data-title={copy?.title ?? "default"}>
      {copy?.searchPrompt ?? "default"}
    </div>
  ),
}));

describe("PlatformTemplatesPage", () => {
  it("passes shared Arabic copy to the catalogue", () => {
    render(
      <PlatformLocaleProvider initialLocale="ar">
        <PlatformTemplatesPage />
      </PlatformLocaleProvider>,
    );

    expect(screen.getByTestId("catalogue")).toHaveAttribute("data-title", arabicTemplatesPageCopy.title);
    expect(screen.getByText(arabicTemplatesPageCopy.searchPrompt)).toBeInTheDocument();
  });

  it("keeps the Kurdish catalogue defaults", () => {
    render(
      <PlatformLocaleProvider initialLocale="ckb">
        <PlatformTemplatesPage />
      </PlatformLocaleProvider>,
    );

    expect(screen.getByTestId("catalogue")).toHaveAttribute("data-title", "default");
  });

  it("passes shared English copy to the catalogue", () => {
    render(<PlatformLocaleProvider initialLocale="en"><PlatformTemplatesPage /></PlatformLocaleProvider>);
    expect(screen.getByTestId("catalogue")).toHaveAttribute("data-title", "Templates");
    expect(screen.getByText("Search templates")).toBeInTheDocument();
  });
});
