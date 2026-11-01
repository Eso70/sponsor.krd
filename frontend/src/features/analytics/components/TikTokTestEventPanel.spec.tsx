import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { businessMessages } from "@/features/business/i18n/messages";
import { TikTokTestEventPanel } from "./TikTokTestEventPanel";
import { KURDISH_TIKTOK_PIXEL_GROUP_COPY } from "./TikTokPixelGroupCard";

const pageId = "11111111-1111-4111-8111-111111111111";
const pages = [{ id: pageId, pageType: "form" as const, name: "Application", url: "https://tenant.sponsor.krd/form/application" }];
afterEach(() => vi.unstubAllGlobals());

describe.each(["en", "ar", "ckb"] as const)("server test panel (%s)", locale => {
  const labels = { ...KURDISH_TIKTOK_PIXEL_GROUP_COPY, ...(locale === "ckb" ? {} : businessMessages[locale].TikTokPixel.group) };
  async function chooseForm() {
    fireEvent.click(screen.getByRole("button", { name: labels.pageType }));
    fireEvent.click(await screen.findByRole("option", { name: labels.form }));
    fireEvent.click(screen.getByRole("button", { name: labels.page }));
    fireEvent.click(await screen.findByRole("option", { name: "Application" }));
    fireEvent.change(screen.getByRole("textbox", { name: labels.testCode }), { target: { value: "TEST31402" } });
    fireEvent.click(screen.getByRole("button", { name: labels.eventType }));
    fireEvent.click(await screen.findByRole("option", { name: labels.submitForm }));
  }
  it.each(["/api/analytics/v2/tiktok/test", "/api/platform/settings/tiktok/test"])("sends JSON with the chosen form and SubmitForm to %s", async endpoint => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: {
      success: true, statusCode: 200, tiktokCode: 0, message: "OK", requestId: "request-1",
      pixelId: "PIXEL_TEST", testEventCode: "TEST31402", eventName: "SubmitForm", sentAt: "2026-11-01",
    } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<TikTokTestEventPanel pixelId="PIXEL_TEST" hasEventsToken endpoint={endpoint} pages={pages} labels={labels} />);
    expect(screen.getByRole("button", { name: labels.test })).toBeDisabled();
    await chooseForm();
    expect(screen.getByText(pages[0].url)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: labels.test }));
    expect(await screen.findByText(labels.testSuccess, { exact: false })).toBeVisible();
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe(endpoint);
    expect(request.headers.get("Content-Type")).toBe("application/json");
    expect(JSON.parse(request.body)).toEqual({ pixel_id: "PIXEL_TEST", page_id: pageId, event_name: "SubmitForm", test_event_code: "TEST31402" });
  });
  it("shows the real validation status and details instead of a fabricated HTTP 500", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, error: {
      code: "VALIDATION_ERROR", message: "Validation failed", details: ["Select a valid published page"],
    } }), { status: 400 })));
    render(<TikTokTestEventPanel pixelId="PIXEL_TEST" hasEventsToken endpoint="/test" pages={pages} labels={labels} />);
    await chooseForm();
    fireEvent.click(screen.getByRole("button", { name: labels.test }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("HTTP 400"));
    expect(screen.getByRole("status")).toHaveTextContent("Select a valid published page");
    expect(screen.getByRole("status")).not.toHaveTextContent("HTTP 500");
  });
});
