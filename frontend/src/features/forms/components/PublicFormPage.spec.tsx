import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormPreview } from "./FormPreview";
import { PublicFormPage } from "./PublicFormPage";
import { createForm, createQuestion } from "../forms-model";
import { formsApi } from "../api";
const tracking = vi.hoisted(() => ({
  trackView: vi.fn(),
  trackEngagement: vi.fn(),
  trackAction: vi.fn(),
}));
vi.mock("../api", () => ({ formsApi: { submit: vi.fn() } }));
vi.mock("@/features/analytics/page-tracking", () => ({
  createPageTracker: () => tracking,
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(formsApi.submit).mockResolvedValue({ id: "receipt" });
});
afterEach(() => vi.restoreAllMocks());
describe("public form submission flow", () => {
  for (const layout of ["form", "card"] as const)
    it(`${layout} sends a real response only after consent and shows final page after success`, async () => {
      vi.spyOn(document, "referrer", "get").mockReturnValue(
        "https://www.tiktok.com/@business",
      );
      const form = {
        ...createForm("en"),
        headline: "Contact",
        name: "Contact",
        slug: "contact",
        revision: 3,
        layout,
        questions: [{ ...createQuestion(), id: "answer", label: "Name" }],
      };
      render(
        <PublicFormPage
          privacyVersion="2026-10-10"
          form={form}
          analytics={{ pixelIds: [], actions: {} }}
        />,
      );
      expect(
        document.querySelector("[data-form-presentation='public']"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 1, name: form.headline }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Return to TikTok" }),
      ).not.toBeInTheDocument();
      expect(tracking.trackView).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByRole("navigation", { name: "Preview pages" }),
      ).not.toBeInTheDocument();
      const clock = vi.spyOn(Date, "now").mockReturnValue(10000);
      if (layout === "card")
        fireEvent.click(screen.getByRole("button", { name: "Start" }));
      fireEvent.click(screen.getByRole("button", { name: "About privacy" }));
      expect(screen.getByText(/Your answers are sent to the form owner/)).toBeInTheDocument();
      fireEvent.pointerDown(document.body);
      fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
        target: { value: "Visitor" },
      });
      const consent = screen.getByRole("checkbox", {
        name: "I agree to the privacy policy",
      });
      expect(consent).toBeChecked();
      fireEvent.click(consent);
      expect(consent).not.toBeChecked();
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
      expect(formsApi.submit).not.toHaveBeenCalled();
      clock.mockReturnValue(14500);
      fireEvent.click(consent);
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
      await waitFor(() =>
        expect(
          screen.getByText("Thank you for your response!"),
        ).toBeInTheDocument(),
      );
      expect(
        screen.getByRole("link", { name: "Return to TikTok" }),
      ).toHaveAttribute("href", "https://www.tiktok.com/@business");
      expect(formsApi.submit).toHaveBeenCalledWith(
        "contact",
        expect.objectContaining({
          revision: 3,
          consent: true,
          answers: { answer: "Visitor" },
          requestId: expect.any(String),
          durationMs: 4500,
          tracking: expect.objectContaining({
            visitorId: expect.any(String),
            sessionId: expect.any(String),
          }),
        }),
      );
      expect(tracking.trackEngagement).toHaveBeenCalledWith(
        "form_view",
        expect.objectContaining({ once: true }),
      );
    });
  it("keeps the editor device presentation as the default", () => {
    render(<FormPreview form={createForm("en")} />);
    expect(
      document.querySelector("[data-form-presentation='preview']"),
    ).toBeInTheDocument();
    expect(
      document.querySelector("[data-form-presentation='public']"),
    ).not.toBeInTheDocument();
  });
  it("keeps answers on failure and retries the same submission ID", async () => {
    vi.mocked(formsApi.submit).mockRejectedValueOnce(new Error("network"));
    const form = {
      ...createForm("en"),
      headline: "Contact",
      slug: "contact",
      revision: 1,
      questions: [{ ...createQuestion(), id: "answer", label: "Name" }],
    };
    render(
      <PublicFormPage
        privacyVersion="2026-10-10"
        form={form}
        analytics={{ pixelIds: [], actions: {} }}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Visitor" },
    });
    expect(screen.getByRole("checkbox")).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not be sent",
    );
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
      "Visitor",
    );
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(formsApi.submit).toHaveBeenCalledTimes(2));
    expect(vi.mocked(formsApi.submit).mock.calls[0][1].requestId).toBe(
      vi.mocked(formsApi.submit).mock.calls[1][1].requestId,
    );
  });
});
