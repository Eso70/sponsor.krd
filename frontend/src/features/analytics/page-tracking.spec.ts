import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  flushNow: vi.fn().mockResolvedValue(undefined),
  handoffAnalyticsEvent: vi.fn().mockReturnValue(true),
  queueAnalyticsEvent: vi.fn(),
  trackedNavigationUrl: vi.fn(),
  createRuntimeId: vi.fn(),
  trackTikTokEvent: vi.fn(),
  recordTikTokDebug: vi.fn(),
}));

vi.mock("@/lib/utils/client-queue", () => ({
  flushNow: mocks.flushNow,
  handoffAnalyticsEvent: mocks.handoffAnalyticsEvent,
  queueAnalyticsEvent: mocks.queueAnalyticsEvent,
  trackedNavigationUrl: mocks.trackedNavigationUrl,
}));
vi.mock("@/lib/utils/random-id", () => ({
  createRuntimeId: mocks.createRuntimeId,
}));
vi.mock("./tiktok-dispatch", () => ({
  trackTikTokEvent: mocks.trackTikTokEvent,
}));
vi.mock("./tiktok-debug", () => ({
  recordTikTokDebug: mocks.recordTikTokDebug,
}));

import { createPageTracker } from "./page-tracking";

const EVENT_ID = "11111111-1111-4111-8111-111111111111";
const PAGE_ID = "22222222-2222-4222-8222-222222222222";
const ACTION_ID = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createRuntimeId.mockReturnValue(EVENT_ID);
  mocks.queueAnalyticsEvent.mockReturnValue(EVENT_ID);
  mocks.trackedNavigationUrl.mockReturnValue(
    `/api/public/analytics/open/${PAGE_ID}/${ACTION_ID}?eventId=${EVENT_ID}`,
  );
});

describe("accepted public form conversions", () => {
  it.each(["form", "linktree"])("uses registered content and action metadata for %s browser events", contentType => {
    const publicId = "55555555-5555-4555-8555-555555555555";
    const tracker = createPageTracker({
      pageId: PAGE_ID, pageName: "Outdated display name", description: "Outdated description", contentType,
      analytics: {
        pixelIds: ["OWNER_PIXEL"], content: { id: publicId, name: "Registered page", description: "Public description" },
        actions: { "page:action": { id: ACTION_ID, pixelEvent: "Contact", contentName: "WhatsApp" } },
      },
    });
    tracker.trackView();
    expect(mocks.trackTikTokEvent).toHaveBeenLastCalledWith("ViewContent", expect.objectContaining({
      content_id: publicId, content_ids: [publicId], content_name: "Registered page", description: "Public description",
      contents: [{ content_id: publicId, content_name: "Registered page" }],
    }), EVENT_ID, ["OWNER_PIXEL"]);
    tracker.trackAction("page:action", "whatsapp_click", { label: "Different rendered label", properties: { platform: "telegram" } });
    expect(mocks.trackTikTokEvent).toHaveBeenLastCalledWith("Contact", expect.objectContaining({
      content_id: ACTION_ID, content_ids: [ACTION_ID], content_name: "WhatsApp", description: "Public description",
      contents: [{ content_id: ACTION_ID, content_name: "WhatsApp" }],
    }), EVENT_ID, ["OWNER_PIXEL"]);
    tracker.trackServerConversion("page:action", "server-receipt-id");
    expect(mocks.trackTikTokEvent).toHaveBeenLastCalledWith("Contact", expect.objectContaining({ content_name: "WhatsApp", content_id: ACTION_ID }), "server-receipt-id", ["OWNER_PIXEL"]);
  });

  it("queues the server counterpart even when the Pixel cannot dispatch", () => {
    mocks.trackTikTokEvent.mockReturnValueOnce(false).mockReturnValueOnce(false);
    const tracker = createPageTracker({ pageId: PAGE_ID, pageName: "Page", contentType: "linktree", analytics: {
      pixelIds: ["OWNER_PIXEL"], actions: { "link:whatsapp": { id: ACTION_ID, pixelEvent: "Contact" } },
    } });
    tracker.trackView();
    tracker.trackAction("link:whatsapp", "whatsapp_click");
    expect(mocks.queueAnalyticsEvent).toHaveBeenCalledTimes(2);
    expect(mocks.queueAnalyticsEvent).toHaveBeenLastCalledWith(expect.objectContaining({ eventId: EVENT_ID, browserDispatched: false, browserEventName: undefined }));
  });

  function formTracker(pixelIds = ["OWNER_PIXEL"], registered = true) {
    return createPageTracker({
      pageId: PAGE_ID,
      pageName: "Contact",
      contentType: "form",
      analytics: {
        pixelIds,
        actions: registered
          ? { "form:submit": { id: ACTION_ID, pixelEvent: "SubmitForm" } }
          : {},
      },
    });
  }

  it("dispatches a confirmed submission once while allowing another submission ID", () => {
    const tracker = formTracker();
    tracker.trackServerConversion("form:submit", EVENT_ID);
    tracker.trackServerConversion("form:submit", EVENT_ID);
    tracker.trackServerConversion("form:submit", "44444444-4444-4444-8444-444444444444");
    expect(mocks.trackTikTokEvent).toHaveBeenCalledTimes(2);
    expect(mocks.queueAnalyticsEvent).not.toHaveBeenCalled();
  });

  it("does not turn a saved response into a failure when the browser SDK throws", () => {
    const tracker = formTracker();
    mocks.trackTikTokEvent.mockImplementationOnce(() => {
      throw new Error("SDK unavailable");
    });
    expect(() => tracker.trackServerConversion("form:submit", EVENT_ID)).not.toThrow();
    expect(mocks.recordTikTokDebug).toHaveBeenCalledWith(expect.objectContaining({
      kind: "error", eventName: "SubmitForm", eventId: EVENT_ID,
      pixelDispatched: false,
    }));
    // An unsuccessful dispatch may be retried with the original server ID.
    tracker.trackServerConversion("form:submit", EVENT_ID);
    tracker.trackServerConversion("form:submit", EVENT_ID);
    expect(mocks.trackTikTokEvent).toHaveBeenCalledTimes(2);
    expect(mocks.queueAnalyticsEvent).not.toHaveBeenCalled();
  });

  it.each([
    { pixelIds: [], registered: true, detail: "No active Pixel configured" },
    { pixelIds: ["OWNER_PIXEL"], registered: false, detail: "Submission action not registered" },
  ])("diagnoses missing tracking configuration: $detail", ({ pixelIds, registered, detail }) => {
    const tracker = formTracker(pixelIds, registered);
    expect(() => tracker.trackServerConversion("form:submit", EVENT_ID)).not.toThrow();
    expect(mocks.trackTikTokEvent).not.toHaveBeenCalled();
    expect(mocks.recordTikTokDebug).toHaveBeenCalledWith(expect.objectContaining({
      kind: "error", eventId: EVENT_ID, actionKey: "form:submit",
      pixelDispatched: false, detail,
    }));
  });

  it("uses the server receipt event ID without queuing a second conversion", () => {
    const tracker = createPageTracker({
      pageId: PAGE_ID,
      pageName: "Contact",
      contentType: "form",
      analytics: {
        pixelIds: ["OWNER_PIXEL"],
        actions: { "form:submit": { id: ACTION_ID, pixelEvent: "SubmitForm" } },
      },
    });
    tracker.trackServerConversion("form:submit", EVENT_ID);
    expect(mocks.trackTikTokEvent).toHaveBeenCalledWith(
      "SubmitForm",
      expect.objectContaining({ content_id: ACTION_ID }),
      EVENT_ID,
      ["OWNER_PIXEL"],
    );
    expect(mocks.queueAnalyticsEvent).not.toHaveBeenCalled();
  });
});

describe("navigation-critical page tracking", () => {
  it("deduplicates a repeated question but records a different selection as one new contact", () => {
    const tracker = createPageTracker({ pageId:PAGE_ID, pageName:"Page", contentType:"linktree", analytics:{ pixelIds:["PIXEL1"], actions:{ "link:test":{ id:ACTION_ID,pixelEvent:"Contact" } } } });
    tracker.trackAction("link:test","whatsapp_click",{ properties:{ whatsappQuestionId:"first" } });
    tracker.trackAction("link:test","whatsapp_click",{ properties:{ whatsappQuestionId:"first" } });
    tracker.trackAction("link:test","whatsapp_click",{ properties:{ whatsappQuestionId:"second" } });
    expect(mocks.queueAnalyticsEvent).toHaveBeenCalledTimes(2);
    expect(mocks.trackTikTokEvent).toHaveBeenCalledTimes(2);
    expect(mocks.queueAnalyticsEvent).toHaveBeenLastCalledWith(expect.objectContaining({ actionId:ACTION_ID, properties:expect.objectContaining({whatsappQuestionId:"second"}) }));
  });
  it("records offer clicks as clicks, not checkout events", () => {
    const tracker = createPageTracker({
      pageId: PAGE_ID,
      pageName: "Holiday Travel",
      contentType: "linktree",
      analytics: { pixelIds: ["PIXEL1"], actions: {} },
    });
    const anchor = document.createElement("a");
    anchor.href = "https://example.com/offer";
    anchor.dataset.pageAction = "page:offer:summer";

    tracker.trackAnchor(anchor);

    expect(mocks.queueAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: "button_click" }),
    );
  });

  it("shares one id across Pixel, queue, beacon, and first-party hop", () => {
    const tracker = createPageTracker({
      pageId: PAGE_ID,
      pageName: "Holiday Travel",
      contentType: "linktree",
      analytics: {
        pixelIds: ["PIXEL1"],
        actions: {
          "link:whatsapp": { id: ACTION_ID, pixelEvent: "Contact" },
        },
      },
    });

    const result = tracker.trackAction("link:whatsapp", "whatsapp_click", {
      destination: "https://wa.me/9647500000000",
    });

    expect(mocks.trackTikTokEvent).toHaveBeenCalledWith(
      "Contact",
      expect.any(Object),
      EVENT_ID,
      ["PIXEL1"],
    );
    expect(mocks.queueAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: EVENT_ID,
        pageId: PAGE_ID,
        actionId: ACTION_ID,
        eventName: "whatsapp_click",
        browserDispatched: true,
        browserEventName: "Contact",
      }),
    );
    expect(mocks.handoffAnalyticsEvent).toHaveBeenCalledWith(EVENT_ID);
    expect(mocks.trackedNavigationUrl).toHaveBeenCalledWith(
      EVENT_ID,
      "https://wa.me/9647500000000",
    );
    expect(result).toEqual({
      eventId: EVENT_ID,
      navigationUrl: expect.stringContaining("/api/public/analytics/open/"),
    });
    expect(
      mocks.handoffAnalyticsEvent.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.flushNow.mock.invocationCallOrder[0]);
  });

  it("suppresses the Pixel and every internal delivery on a double tap", () => {
    const tracker = createPageTracker({
      pageId: PAGE_ID,
      pageName: "Holiday Travel",
      contentType: "linktree",
      analytics: {
        pixelIds: ["PIXEL1"],
        actions: {
          "link:whatsapp": { id: ACTION_ID, pixelEvent: "Contact" },
        },
      },
    });

    tracker.trackAction("link:whatsapp", "whatsapp_click", {
      destination: "https://wa.me/9647500000000",
    });
    const repeated = tracker.trackAction("link:whatsapp", "whatsapp_click", {
      destination: "https://wa.me/9647500000000",
    });

    expect(repeated).toBeUndefined();
    expect(mocks.trackTikTokEvent).toHaveBeenCalledTimes(1);
    expect(mocks.queueAnalyticsEvent).toHaveBeenCalledTimes(1);
    expect(mocks.handoffAnalyticsEvent).toHaveBeenCalledTimes(1);
  });
});
