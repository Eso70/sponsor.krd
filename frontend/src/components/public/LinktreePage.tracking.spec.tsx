import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type { TemplateComponentProps } from "@/components/templates/types";
import { LinktreePage } from "./LinktreePage";

const tracker = vi.hoisted(() => ({
  trackView: vi.fn(),
  trackAction: vi.fn(),
  trackEngagement: vi.fn(),
}));
const templateRender = vi.hoisted(() => vi.fn());
vi.mock("@/features/analytics/page-tracking", () => ({
  createPageTracker: () => tracker,
}));
vi.mock("@/features/analytics/page-engagement", () => ({
  startPageEngagement: vi.fn(),
}));
vi.mock("@/components/analytics/TikTokPixel", () => ({
  TikTokPixel: () => null,
}));
vi.mock("@/components/templates/DynamicTemplate", async () => {
  const { memo } = await import("react");
  return { DynamicTemplate: memo(function Template({ onLinkClick, onSponsorClick }: TemplateComponentProps) {
    templateRender();
    return (
    <>
    <button onClick={() => onSponsorClick?.("https://example.com", "Acme")}>Sponsor</button>
    <button
      onClick={() =>
        onLinkClick?.(
          "11111111-1111-4111-8111-111111111111",
          "https://wa.me/9647500000000",
          "whatsapp",
        )
      }
    >
      WhatsApp
    </button>
    </>
  );
  }) };
});

const props: ComponentProps<typeof LinktreePage> = {
  linktree: {
    id: "22222222-2222-4222-8222-222222222222",
    uid: "example",
    name: "Example",
    background_color: "#ffffff",
    template_config: {
      whatsapp_modal: {
        enabled: true,
        questions: [
          { id: "price", text: "Price enquiry", message: "How much?" },
        ],
      },
    },
  },
  links: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      platform: "whatsapp",
      url: "https://wa.me/9647500000000",
    },
  ],
  analytics: { pixelIds: [], actions: {} },
  initialLocale: "en",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "open").mockImplementation(() => null);
});

describe("published WhatsApp question tracking", () => {
  it("uses the saved question theme independently of the page background", () => {
    render(<LinktreePage {...props} linktree={{ ...props.linktree, background_color: "#ffffff", template_config: {
      whatsapp_modal: { enabled: true, backgroundColor: "#123456", questions: [{ id: "price", text: "Price enquiry", message: "How much?" }] },
    } }} />);
    fireEvent.click(screen.getByRole("button", { name: "WhatsApp" }));
    expect(screen.getByRole("dialog").style.getPropertyValue("--picker-surface")).toBe("#123456");
  });
  it("does not repaint the template when the question chooser opens or closes", () => {
    render(<LinktreePage {...props} />);
    expect(templateRender).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "WhatsApp" }));
    expect(templateRender).toHaveBeenCalledOnce();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(templateRender).toHaveBeenCalledOnce();
  });
  it("hands off chooser engagement immediately and attributes a selection without a dismissal", () => {
    render(<LinktreePage {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "WhatsApp" }));
    expect(tracker.trackEngagement).toHaveBeenCalledWith(
      "action_open",
      expect.objectContaining({
        immediate: true,
        properties: expect.objectContaining({ step: "opened" }),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Price enquiry" }));
    expect(tracker.trackAction).toHaveBeenCalledExactlyOnceWith(
      expect.any(String),
      "whatsapp_click",
      expect.objectContaining({
        properties: { platform: "whatsapp", whatsappQuestionId: "price" },
      }),
    );
    expect(tracker.trackEngagement).toHaveBeenCalledTimes(1);
    expect(window.open).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("hands off a real dismissal immediately", () => {
    render(<LinktreePage {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "WhatsApp" }));
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(tracker.trackEngagement).toHaveBeenLastCalledWith(
      "action_open",
      expect.objectContaining({
        immediate: true,
        properties: expect.objectContaining({ step: "dismissed" }),
      }),
    );
    expect(tracker.trackAction).not.toHaveBeenCalled();
  });

  it("keeps previews out of analytics", () => {
    render(<LinktreePage {...props} enableMarketingTracking={false} />);
    fireEvent.click(screen.getByRole("button", { name: "WhatsApp" }));
    fireEvent.click(screen.getByRole("button", { name: "Price enquiry" }));
    expect(tracker.trackView).not.toHaveBeenCalled();
    expect(tracker.trackEngagement).not.toHaveBeenCalled();
    expect(tracker.trackAction).not.toHaveBeenCalled();
  });
});

describe("sponsor navigation tracking", () => {
  it("uses only the shared engagement tracker for a sponsor destination", () => {
    render(<LinktreePage {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Sponsor" }));
    expect(tracker.trackEngagement).toHaveBeenCalledExactlyOnceWith("action_open", expect.objectContaining({
      actionKey: "page:sponsor-click", immediate: true, destination: "https://example.com", label: "Acme",
    }));
    expect(tracker.trackAction).not.toHaveBeenCalled();
  });
  it("does not track sponsor actions on previews or business homepages", () => {
    render(<LinktreePage {...props} enableMarketingTracking={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Sponsor" }));
    expect(tracker.trackEngagement).not.toHaveBeenCalled();
    expect(tracker.trackAction).not.toHaveBeenCalled();
  });
});
