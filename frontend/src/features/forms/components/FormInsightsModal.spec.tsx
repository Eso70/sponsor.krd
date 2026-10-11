import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormInsightsModal } from "./FormInsightsModal";
import { formsApi } from "../api";
import { formsCopy } from "../forms-copy";
import { createForm } from "../forms-model";

vi.mock("../api", () => ({
  formsApi: {
    analytics: vi.fn(),
    submissions: vi.fn(),
    deleteSubmissions: vi.fn(),
  },
}));
const copy = formsCopy("en");
const metrics = {
  views: 10,
  visitors: 5,
  starts: 4,
  submissions: 2,
  clicks: 8,
  completion: {
    from: "2026-10-01T00:00:00Z",
    to: "2026-10-14T00:00:00Z",
    starts: 4,
    responses: 2,
    rate: 50,
  },
};
const response = {
  id: "response",
  createdAt: "2026-10-10T12:00:00Z",
  answers: [
    { questionId: "name", label: "Name", value: "Example customer" },
    { questionId: "company", label: "Company", value: "Example business" },
    { questionId: "message", label: "Message", value: "Call me later" },
  ],
  consent: true,
  revision: 2,
  privacyVersion: "2026-10",
  durationMs: 12000,
  attribution: { source: "newsletter", campaign: "launch" },
};
const show = (scope: "business" | "platform" = "business") =>
  render(
    <FormInsightsModal
      form={createForm("en")}
      scope={scope}
      locale="en"
      copy={copy}
      onClose={vi.fn()}
    />,
  );
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(formsApi.analytics).mockResolvedValue(metrics);
  vi.mocked(formsApi.submissions).mockResolvedValue({
    items: [response],
    total: 1,
  });
});
describe("combined form insights", () => {
  it.each(["business", "platform"] as const)(
    "%s can clear tracking when there are no submissions",
    async (scope) => {
      vi.mocked(formsApi.analytics).mockResolvedValue({
        ...metrics,
        submissions: 0,
      });
      vi.mocked(formsApi.submissions).mockResolvedValue({
        items: [],
        total: 0,
      });
      render(
        <FormInsightsModal
          form={createForm("en")}
          scope={scope}
          locale="en"
          copy={copy}
          onClose={vi.fn()}
          canDeleteResponses
        />,
      );
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: copy.deleteResponses }),
        ).toBeEnabled(),
      );
      fireEvent.click(
        screen.getByRole("button", { name: copy.deleteResponses }),
      );
      expect(
        screen.getByRole("dialog", { name: copy.deleteResponses }),
      ).toHaveTextContent("tracking history");
    },
  );
  it.each(["business", "platform"] as const)(
    "%s confirms deleting all responses and refreshes both sets of data",
    async (scope) => {
      const changed = vi.fn();
      const form = createForm("en");
      vi.mocked(formsApi.deleteSubmissions).mockResolvedValue({ deleted: 1 });
      render(
        <FormInsightsModal
          form={form}
          scope={scope}
          locale="en"
          copy={copy}
          onClose={vi.fn()}
          canDeleteResponses
          onResponsesDeleted={changed}
          headerControls={
            <button type="button">Shared appearance control</button>
          }
        />,
      );
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: copy.deleteResponses }),
        ).toBeEnabled(),
      );
      expect(
        screen.getByRole("button", { name: "Shared appearance control" }),
      ).toBeInTheDocument();
      const actions = within(document.querySelector("header")!).getAllByRole(
        "button",
      );
      expect(
        actions.slice(0, 3).map((button) => button.getAttribute("aria-label")),
      ).toEqual([copy.refreshData, copy.exportCsv, copy.deleteResponses]);
      expect(actions.at(-1)).toHaveAttribute("aria-label", copy.close);

      fireEvent.click(
        screen.getByRole("button", { name: copy.deleteResponses }),
      );
      expect(formsApi.deleteSubmissions).not.toHaveBeenCalled();
      const confirmation = screen.getByRole("dialog", {
        name: copy.deleteResponses,
      });
      expect(confirmation).toHaveTextContent(copy.deleteResponsesMessage);
      expect(confirmation.parentElement).toHaveClass("z-[150]");
      vi.mocked(formsApi.submissions).mockResolvedValue({
        items: [],
        total: 0,
      });
      vi.mocked(formsApi.analytics).mockResolvedValue({
        ...metrics,
        submissions: 0,
      });
      fireEvent.click(
        within(confirmation).getByRole("button", {
          name: copy.deleteResponses,
        }),
      );
      await waitFor(() =>
        expect(formsApi.deleteSubmissions).toHaveBeenCalledWith(scope, form.id),
      );
      await waitFor(() => expect(changed).toHaveBeenCalledOnce());
      expect(formsApi.submissions).toHaveBeenCalledTimes(2);
      expect(formsApi.analytics).toHaveBeenCalledTimes(2);
      expect(
        screen.queryByRole("dialog", { name: copy.deleteResponses }),
      ).not.toBeInTheDocument();
    },
  );
  it("keeps deletion failures inline and hides deletion for read-only viewers", async () => {
    const props = {
      form: createForm("en"),
      scope: "business" as const,
      locale: "en" as const,
      copy,
      onClose: vi.fn(),
    };
    const view = render(<FormInsightsModal {...props} />);
    expect(
      screen.queryByRole("button", { name: copy.deleteResponses }),
    ).not.toBeInTheDocument();
    view.rerender(<FormInsightsModal {...props} canDeleteResponses />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: copy.deleteResponses }),
      ).toBeEnabled(),
    );
    vi.mocked(formsApi.deleteSubmissions).mockRejectedValue(
      new Error("failed"),
    );
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: copy.deleteResponses }));
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: copy.deleteResponses }),
      ).getByRole("button", { name: copy.deleteResponses }),
    );
    await waitFor(() =>
      expect(screen.getByText(copy.deleteResponsesError)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("dialog", { name: copy.deleteResponses }),
    ).toBeInTheDocument();
    expect(formsApi.submissions).toHaveBeenCalledOnce();
    errorLog.mockRestore();
  });

  it("does not infer completion from lifetime responses when tracked starts are unavailable", async () => {
    vi.mocked(formsApi.analytics).mockResolvedValue({
      ...metrics,
      submissions: 1000,
      completion: {
        ...metrics.completion,
        starts: 0,
        responses: 0,
        rate: null,
      },
    });
    show();
    const overview = screen.getByRole("region", { name: copy.analytics });
    await waitFor(() => expect(overview).toHaveTextContent(copy.ratePeriod));
    expect(overview).not.toHaveTextContent("100.0%");
    expect(overview).not.toHaveTextContent("0.0%");
    expect(overview).toHaveTextContent("—");
  });
  it("searches on the server, resets pagination and expands full details only when requested", async () => {
    show();
    await waitFor(() =>
      expect(screen.getAllByText("Example customer").length).toBeGreaterThan(0),
    );
    expect(screen.queryByText("Call me later")).not.toBeInTheDocument();
    fireEvent.change(
      screen.getByRole("textbox", { name: copy.responseSearch }),
      { target: { value: "customer" } },
    );
    await waitFor(() =>
      expect(formsApi.submissions).toHaveBeenLastCalledWith(
        "business",
        expect.any(String),
        0,
        expect.any(AbortSignal),
        { pageSize: 20, q: "customer" },
      ),
    );
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: copy.viewDetails }).length,
      ).toBeGreaterThan(0),
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: copy.viewDetails })[0],
    );
    expect(screen.getAllByText("Call me later").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: copy.hideDetails })[0],
    ).toHaveAttribute("aria-expanded", "true");
  });
  it("shows a simple search without dates and clears the search", async () => {
    show();
    const search = screen.getByRole("textbox", { name: copy.responseSearch });
    expect(document.querySelector('input[type="date"]')).toBeNull();
    fireEvent.change(search, { target: { value: "customer" } });
    fireEvent.click(screen.getByRole("button", { name: copy.clearFilters }));
    expect(search).toHaveValue("");
    await waitFor(() =>
      expect(formsApi.submissions).toHaveBeenLastCalledWith(
        "business",
        expect.any(String),
        0,
        expect.any(AbortSignal),
        { pageSize: 20 },
      ),
    );
  });
  it.each(["business", "platform"] as const)(
    "shows essential metrics and customer answers without tracking clutter for %s",
    async (scope) => {
      vi.mocked(formsApi.analytics).mockResolvedValue({
        ...metrics,
        insights: {
          sourcePerformance: [
            { label: "newsletter", starts: 4, responses: 2, rate: 50 },
          ],
          answerSummaries: [
            {
              questionId: "choice",
              label: "Preferred contact",
              totalAnswers: 2,
              options: [
                { label: "Phone", count: 2, percentage: 100 },
                { label: "Email", count: 0, percentage: 0 },
              ],
            },
          ],
          averageDurationMs: 12000,
          latestSubmissionAt: response.createdAt,
          daily: [{ day: "2026-10-10", count: 2 }],
          sources: [{ label: "newsletter", count: 2 }],
          devices: [{ label: "desktop", count: 2 }],
          countries: [{ label: "IQ", count: 2 }],
        },
      });
      show(scope);
      const answers = screen.getByRole("region", { name: copy.submissions });
      await waitFor(() =>
        expect(
          within(answers).getAllByText("Example customer").length,
        ).toBeGreaterThan(0),
      );
      fireEvent.click(
        within(answers).getAllByRole("button", { name: copy.viewDetails })[0],
      );
      expect(
        within(answers).getAllByText("Call me later").length,
      ).toBeGreaterThan(0);
      for (const label of [
        copy.responseId,
        copy.device,
        copy.policyVersion,
        copy.formVersion,
        copy.privacyConsent,
      ]) {
        expect(within(answers).queryByText(label)).not.toBeInTheDocument();
      }
      expect(within(answers).getAllByText("newsletter").length).toBeGreaterThan(
        0,
      );
      expect(within(answers).queryByText("launch")).not.toBeInTheDocument();
      const overview = screen.getByRole("region", { name: copy.analytics });
      expect(overview).toHaveTextContent(copy.views);
      expect(overview).toHaveTextContent(copy.submissions);
      expect(overview).toHaveTextContent(copy.starts);
      expect(overview).toHaveTextContent(copy.rate);
      expect(overview).toHaveTextContent("50.0%");
      expect(overview).toHaveTextContent(copy.interactions);
      expect(overview).toHaveTextContent(copy.visitors);
      expect(overview).toHaveTextContent(copy.recentResponses);
      const insightsToggle = within(overview).getByText(copy.insights);
      fireEvent.click(insightsToggle);
      expect(insightsToggle.closest("details")).toHaveAttribute("open");
      expect(within(overview).getByTitle("2026-10-10: 2")).toBeInTheDocument();
      expect(overview).toHaveTextContent(copy.topSources);
      expect(
        within(overview).getByRole("region", { name: copy.sourcePerformance }),
      ).toHaveTextContent("newsletter");
      expect(
        within(overview).getByRole("region", { name: copy.answerSummaries }),
      ).toHaveTextContent("2 · 100.0%");
      expect(formsApi.submissions).toHaveBeenCalledWith(
        scope,
        expect.any(String),
        0,
        expect.any(AbortSignal),
        expect.objectContaining({ pageSize: 20 }),
      );
      expect(formsApi.analytics).toHaveBeenCalledWith(
        scope,
        expect.any(String),
        expect.any(AbortSignal),
      );
    },
  );
  it("keeps analytics visible when responses fail and retries the failed request", async () => {
    vi.mocked(formsApi.submissions).mockRejectedValueOnce(new Error("offline"));
    show();
    await screen.findByText(copy.responsesError);
    expect(
      screen.getByRole("region", { name: copy.analytics }),
    ).toHaveTextContent(copy.views);
    fireEvent.click(screen.getByRole("button", { name: copy.retry }));
    await waitFor(() =>
      expect(screen.getAllByText("Example customer").length).toBeGreaterThan(0),
    );
    expect(formsApi.analytics).toHaveBeenCalledTimes(1);
    expect(formsApi.submissions).toHaveBeenCalledTimes(2);
  });
  it("keeps answers visible when analytics fail and can reload analytics", async () => {
    vi.mocked(formsApi.analytics).mockRejectedValueOnce(new Error("offline"));
    show();
    await screen.findByText(copy.analyticsError);
    expect(screen.getAllByText("Example customer").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: copy.retry }));
    await waitFor(() =>
      expect(screen.queryByText(copy.analyticsError)).not.toBeInTheDocument(),
    );
    expect(formsApi.submissions).toHaveBeenCalledTimes(1);
  });
  it("loads subsequent pages and cancels requests when closed", async () => {
    vi.mocked(formsApi.submissions).mockResolvedValue({
      items: [response],
      total: 21,
    });
    const view = show();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: copy.next })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: copy.next }));
    await waitFor(() =>
      expect(formsApi.submissions).toHaveBeenLastCalledWith(
        "business",
        expect.any(String),
        1,
        expect.any(AbortSignal),
        expect.objectContaining({ pageSize: 20 }),
      ),
    );
    const responseSignal = vi
      .mocked(formsApi.submissions)
      .mock.calls.at(-1)?.[3];
    const analyticsSignal = vi.mocked(formsApi.analytics).mock.calls[0]?.[2];
    view.unmount();
    expect(responseSignal?.aborted).toBe(true);
    expect(analyticsSignal?.aborted).toBe(true);
  });
});
