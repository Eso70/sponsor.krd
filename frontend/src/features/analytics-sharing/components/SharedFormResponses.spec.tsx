import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { SharedFormResponses } from "./SharedFormResponses";
import { formsCopy } from "@/features/forms/forms-copy";
const mocks = vi.hoisted(() => ({ request: vi.fn(), download: vi.fn() }));
vi.mock("@/lib/api/request", async (original) => ({
  ...(await original<typeof import("@/lib/api/request")>()),
  apiRequest: mocks.request,
}));
vi.mock("@/lib/utils/download", () => ({ downloadBlob: mocks.download }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const data = {
  total: 1,
  snapshotAt: "2026-10-20T12:00:00Z",
  items: [
    {
      id: "response",
      createdAt: "2026-10-20T00:00:00Z",
      consent: true,
      revision: 1,
      answers: [
        { questionId: "name", label: "Name", value: "Customer" },
        { questionId: "phone", label: "Phone", value: "+9647501234567" },
      ],
    },
  ],
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.request.mockResolvedValue(data);
});
it("keeps search usable and reuses full and date-range CSV exports through the share session", async () => {
  const copy = formsCopy("en");
  render(
    <SharedFormResponses
      apiBase="/api/public/analytics-shares/share"
      initialData={data}
      name="Orders"
      definition={{ id: "form-id", name: "Orders", slug: "orders" }}
      locale="en"
      onAccessLost={vi.fn()}
    />,
  );
  const input = screen.getByRole("textbox", { name: copy.responseSearch });
  expect(document.querySelector('a[href^="https://wa.me/"]')).toBeNull();
  fireEvent.change(input, { target: { value: "Customer" } });
  await waitFor(() =>
    expect(mocks.request).toHaveBeenCalledWith(
      "/api/public/analytics-shares/share/responses?page=0&pageSize=20&q=Customer",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    ),
  );
  expect(input).toHaveValue("Customer");
  const menu = screen.getByRole("button", { name: copy.exportData });
  await waitFor(() => expect(menu).toBeEnabled());
  fireEvent.click(menu);
  fireEvent.click(screen.getByRole("option", { name: copy.exportCsv }));
  await waitFor(() => expect(mocks.download).toHaveBeenCalledOnce());
  expect(mocks.download.mock.calls[0][1]).toMatch(/^orders-responses-/);
  expect(mocks.request).toHaveBeenCalledWith(
    "/api/public/analytics-shares/share/responses?page=0&pageSize=100&q=Customer",
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  await waitFor(() => expect(menu).toBeEnabled());
  fireEvent.click(menu);
  fireEvent.click(screen.getByRole("option", { name: copy.exportRange }));
  const range = screen.getByRole("region", { name: copy.exportRange });
  fireEvent.change(
    within(range).getByRole("textbox", { name: copy.exportFrom }),
    { target: { value: "26/10/01" } },
  );
  fireEvent.blur(within(range).getByRole("textbox", { name: copy.exportFrom }));
  fireEvent.change(
    within(range).getByRole("textbox", { name: copy.exportTo }),
    { target: { value: "26/10/20" } },
  );
  fireEvent.blur(within(range).getByRole("textbox", { name: copy.exportTo }));
  fireEvent.click(within(range).getByRole("button", { name: copy.exportCsv }));
  await waitFor(() => expect(mocks.download).toHaveBeenCalledTimes(2));
  expect(mocks.request).toHaveBeenCalledWith(
    "/api/public/analytics-shares/share/responses?page=0&pageSize=100&q=Customer&from=2026-10-01&to=2026-10-20",
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
});
