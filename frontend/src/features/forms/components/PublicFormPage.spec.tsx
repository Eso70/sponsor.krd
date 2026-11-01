import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAnalyticsAttribution } from "@/lib/utils/client-queue";
import type { ReactNode } from "react";
import type { FormResponseValues } from "./FormPreview";
import { createForm } from "../forms-model";
import { PublicFormPage } from "./PublicFormPage";

const mocks = vi.hoisted(() => ({
  submit: vi.fn(),
  conversion: vi.fn(),
  view: vi.fn(),
  pixel: vi.fn(),
  submitPreview: null as
    null | ((response: FormResponseValues) => Promise<void>),
}));
vi.mock("../api", () => ({ formsApi: { submit: mocks.submit } }));
vi.mock("@/features/analytics/page-tracking", () => ({
  createPageTracker: () => ({
    trackView: mocks.view,
    trackServerConversion: mocks.conversion,
    trackAction: vi.fn(),
    trackEngagement: vi.fn(),
  }),
}));
vi.mock("@/components/analytics/TikTokPixel", () => ({
  TikTokPixel: (props: unknown) => {
    mocks.pixel(props);
    return null;
  },
}));
vi.mock("./PublicFormShell", () => ({
  PublicFormShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("./FormPreview", () => ({
  FormPreview: ({
    onSubmit,
  }: {
    onSubmit: (response: FormResponseValues) => Promise<void>;
  }) => {
    mocks.submitPreview = onSubmit;
    return null;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.submitPreview = null;
});
const originalUrl = window.location.href;
afterEach(() => window.history.replaceState({}, "", originalUrl));

describe("public form browser tracking", () => {
  it.each(["form", "card"] as const)("retains the ad click for the accepted %s submission after navigation", async layout => {
    window.history.replaceState({}, "", "/linktree/landing?ttclid=real-ad-click");
    getAnalyticsAttribution();
    window.history.replaceState({}, "", "/form/contact");
    render(<PublicFormPage form={{ ...createForm("en"), slug: "contact", revision: 1, layout }}
      privacyVersion="2026-10-11" analytics={{ pixelIds: ["OWNER_PIXEL"], actions: {} }} />);
    mocks.submit.mockResolvedValueOnce({ id: "receipt" });
    await act(async () => { await mocks.submitPreview!({ answers: {}, phoneCountryCodes: {}, consent: true }); });
    expect(mocks.submit).toHaveBeenCalledWith("contact", expect.objectContaining({
      tracking: expect.objectContaining({ ttclid: "real-ad-click", pageUrl: expect.stringContaining("/form/contact") }),
    }));
  });

  it.each(["form", "card"] as const)(
    "fires only after server acceptance in %s layout and reuses the retry ID",
    async (layout) => {
      const form = {
        ...createForm("en"),
        slug: "contact",
        revision: 1,
        layout,
      };
      render(
        <PublicFormPage
          form={form}
          privacyVersion="2026-10-11"
          analytics={{ pixelIds: ["OWNER_PIXEL"], actions: {} }}
        />,
      );
      expect(mocks.pixel).toHaveBeenCalledWith({
        pixelIds: ["OWNER_PIXEL"],
        pageKey: form.id,
      });
      expect(mocks.view).toHaveBeenCalled();
      const response = { answers: {}, phoneCountryCodes: {}, consent: true };
      mocks.submit.mockRejectedValueOnce(new Error("Network failure"));
      await act(async () => {
        await expect(mocks.submitPreview!(response)).rejects.toThrow(
          "Network failure",
        );
      });
      expect(mocks.conversion).not.toHaveBeenCalled();
      const firstInput = mocks.submit.mock.calls[0][1] as { requestId: string };
      mocks.submit.mockResolvedValueOnce({ id: "receipt" });
      await act(async () => {
        await mocks.submitPreview!(response);
      });
      const retryInput = mocks.submit.mock.calls[1][1] as { requestId: string };
      expect(retryInput.requestId).toBe(firstInput.requestId);
      expect(mocks.conversion).toHaveBeenCalledOnce();
      expect(mocks.conversion).toHaveBeenCalledWith(
        "form:submit",
        firstInput.requestId,
      );
    },
  );
});
