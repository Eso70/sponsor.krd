import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useFormSubmission } from "./use-form-submission";
import { formsCopy } from "./forms-copy";
import { createPageTracker } from "@/features/analytics/page-tracking";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/features/analytics/tiktok-dispatch", () => ({
  trackTikTokEvent: () => { throw new Error("Browser SDK unavailable"); },
}));
beforeEach(() => vi.clearAllMocks());
const response = { answers: {}, phoneCountryCodes: {}, consent: true };

describe("form submission notifications", () => {
  it("shows success for a saved response even when TikTok reporting throws", async () => {
    const copy = formsCopy("en");
    const tracker = createPageTracker({
      pageId: "22222222-2222-4222-8222-222222222222",
      pageName: "Contact",
      contentType: "form",
      analytics: {
        pixelIds: ["OWNER_PIXEL"],
        actions: { "form:submit": { id: "action", pixelEvent: "SubmitForm" } },
      },
    });
    const save = vi.fn().mockResolvedValue({ id: "receipt" });
    const advance = vi.fn();
    const { result } = renderHook(() => useFormSubmission(async () => {
      await save();
      tracker.trackServerConversion("form:submit", "11111111-1111-4111-8111-111111111111");
    }, copy));
    await act(async () => { await result.current.submit(response, advance); });
    expect(save).toHaveBeenCalledOnce();
    expect(result.current.failed).toBe(false);
    expect(advance).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledExactlyOnceWith(copy.notifications.submitted);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it.each(["en", "ar", "ckb"] as const)("confirms only accepted responses in %s", async (locale) => {
    const copy = formsCopy(locale);
    let finish!: () => void;
    const submit = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const advance = vi.fn();
    const { result } = renderHook(() => useFormSubmission(submit, copy));
    let pending!: Promise<void>;
    act(() => { pending = result.current.submit(response, advance); });
    await act(async () => { await result.current.submit(response, advance); });
    expect(submit).toHaveBeenCalledOnce();
    expect(toast.success).not.toHaveBeenCalled();
    await act(async () => { finish(); await pending; });
    expect(toast.success).toHaveBeenCalledExactlyOnceWith(copy.notifications.submitted);
    expect(advance).toHaveBeenCalledOnce();
  });
  it.each(["en", "ar", "ckb"] as const)("retains inline failure and reports safe errors in %s", async (locale) => {
    const copy = formsCopy(locale);
    const advance = vi.fn();
    const { result } = renderHook(() => useFormSubmission(vi.fn().mockRejectedValue(new Error("Private server details")), copy));
    await act(async () => { await result.current.submit(response, advance); });
    expect(result.current.failed).toBe(true);
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(copy.submitError);
    expect(toast.success).not.toHaveBeenCalled();
    expect(advance).not.toHaveBeenCalled();
  });
  it("does not report preview completion as a real response", async () => {
    const advance = vi.fn();
    const { result } = renderHook(() => useFormSubmission(undefined, formsCopy("en")));
    await act(async () => { await result.current.submit(response, advance); });
    expect(advance).toHaveBeenCalledOnce();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
