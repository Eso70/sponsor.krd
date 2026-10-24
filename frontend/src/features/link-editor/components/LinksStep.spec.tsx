import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LinksStep } from "./LinksStep";
import type { SocialLink } from "@/features/link-editor/types";
import { arabicEditorCopy, englishEditorCopy } from "../editor-copy";

function socialLink(id: string, platform: string, order: number): SocialLink {
  return {
    id,
    platform,
    order,
    url: "",
    value: "",
    enabled: true,
  };
}

describe("LinksStep", () => {
  it("reuses the Form drag handle, supports keyboard moves, and pins GPS", () => {
    const reorder = vi.fn();
    const links = [socialLink("one", "instagram", 0), socialLink("two", "youtube", 1), socialLink("gps", "gps", 2)];
    render(<LinksStep copy={englishEditorCopy} selectedPlatforms={links.map((link) => link.id)} socialLinks={links}
      linkErrors={{}} onUpdateLink={vi.fn()} onUpdateCountryCode={vi.fn()} onUpdateDisplayName={vi.fn()}
      onUpdateCustomColor={vi.fn()} onUpdateCustomIcon={vi.fn()} onRemoveLink={vi.fn()} onAddPlatformInstance={vi.fn()}
      onReorderLink={reorder} onBlurLink={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Move up" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Move down" })).not.toBeInTheDocument();
    const handle = screen.getByRole("button", { name: /reorder.*Instagram/i });
    expect(handle.closest("[data-reorder-id]")).toHaveAttribute("data-reorder-id", "one");
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(reorder).toHaveBeenCalledWith("one", "two");
    fireEvent.keyDown(screen.getByRole("button", { name: /reorder.*YouTube/i }), { key: "ArrowDown" });
    expect(reorder).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /reorder.*GPS/i })).not.toBeInTheDocument();
  });
  it("renders every platform instance selected in the previous step", () => {
    const links = [
      socialLink("instagram-1", "instagram", 0),
      socialLink("youtube-1", "youtube", 1),
      socialLink("whatsapp-1", "whatsapp", 2),
    ];

    render(
      <LinksStep
        selectedPlatforms={links.map((link) => link.id)}
        socialLinks={links}
        linkErrors={{}}
        onUpdateLink={vi.fn()}
        onUpdateCountryCode={vi.fn()}
        onUpdateDisplayName={vi.fn()}
        onUpdateCustomColor={vi.fn()}
        onUpdateCustomIcon={vi.fn()}
        onRemoveLink={vi.fn()}
        onAddPlatformInstance={vi.fn()}
        onReorderLink={vi.fn()}
        onBlurLink={vi.fn()}
      />,
    );

    expect(screen.getByText("3 لینک")).toBeInTheDocument();
    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("YouTube")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
  });

  it("shows Business link controls in Arabic", () => {
    const link = socialLink("telegram-1", "telegram", 0);
    render(
      <LinksStep
        copy={arabicEditorCopy}
        selectedPlatforms={[link.id]}
        socialLinks={[link]}
        linkErrors={{}}
        onUpdateLink={vi.fn()}
        onUpdateCountryCode={vi.fn()}
        onUpdateDisplayName={vi.fn()}
        onUpdateCustomColor={vi.fn()}
        onUpdateCustomIcon={vi.fn()}
        onRemoveLink={vi.fn()}
        onAddPlatformInstance={vi.fn()}
        onReorderLink={vi.fn()}
        onBlurLink={vi.fn()}
      />,
    );

    expect(screen.getByText("1 رابط")).toBeInTheDocument();
    expect(screen.getByText("تيليجرام")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("رابط تيليجرام")).toBeInTheDocument();
  });
});
