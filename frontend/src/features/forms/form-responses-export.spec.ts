import { beforeEach, describe, expect, it, vi } from "vitest";
import { formsApi } from "./api";
import { downloadBlob } from "@/lib/utils/download";
import { exportFormResponses, formResponsesCsv } from "./form-responses-export";
import { formsCopy } from "./forms-copy";
import { createForm } from "./forms-model";
import type { FormSubmission } from "./types";

vi.mock("./api", () => ({ formsApi: { submissions: vi.fn() } }));
vi.mock("@/lib/utils/download", () => ({ downloadBlob: vi.fn() }));
const copy = formsCopy("en"),
  form = { ...createForm("en"), slug: "contact", name: "Contact" };
const response: FormSubmission = {
  id: "r1",
  createdAt: "2026-10-10T10:00:00Z",
  revision: 2,
  consent: true,
  privacyVersion: "2026-10",
  durationMs: 15000,
  answers: [
    { questionId: "name", label: "Name", value: 'سڵاو, "مرحبا"\nHello' },
    { questionId: "phone", label: "Phone", value: "+9647501234567" },
  ],
  attribution: { campaign: "launch", source: "newsletter" },
};
beforeEach(() => vi.resetAllMocks());
describe("form CSV export", () => {
  it("includes multilingual text, safe spreadsheet cells, metadata and questions from old revisions", () => {
    const csv = formResponsesCsv(
      form,
      [
        response,
        {
          ...response,
          id: "r2",
          answers: [
            { questionId: "old", label: "=HYPERLINK()", value: " =1+1" },
          ],
        },
      ],
      copy,
    );
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"سڵاو, ""مرحبا""\nHello"');
    expect(csv).toContain('"\'+9647501234567"');
    expect(csv).toContain('"\'=HYPERLINK()"');
    expect(csv).toContain('"\' =1+1"');
    expect(csv).toContain('"2026-10-10T10:00:00.000Z"');
    expect(csv).toContain('"newsletter","launch"');
    expect(csv).toContain('"15","Accepted","2026-10","2"');
    expect(csv.endsWith("\r\n")).toBe(true);
  });
  it.each(["business", "platform"] as const)(
    "exports all filtered pages using the server snapshot for %s",
    async (scope) => {
      const first = Array.from({ length: 100 }, (_, id) => ({
        ...response,
        id: String(id),
      }));
      vi.mocked(formsApi.submissions)
        .mockResolvedValueOnce({
          items: first,
          total: 101,
          snapshotAt: "2026-10-10T12:00:00Z",
        })
        .mockResolvedValueOnce({
          items: [{ ...response, id: "100" }],
          total: 101,
        });
      const controller = new AbortController(),
        progress = vi.fn();
      await exportFormResponses(
        scope,
        form,
        { q: "customer", from: "2026-10-01" },
        copy,
        controller.signal,
        progress,
      );
      expect(formsApi.submissions).toHaveBeenNthCalledWith(
        2,
        scope,
        form.id,
        1,
        controller.signal,
        {
          q: "customer",
          from: "2026-10-01",
          pageSize: 100,
          before: "2026-10-10T12:00:00Z",
        },
      );
      expect(progress).toHaveBeenLastCalledWith(101, 101);
      expect(downloadBlob).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/^contact-responses-.*\.csv$/),
      );
    },
  );
  it("never downloads a partial export when a page fails or export is cancelled", async () => {
    vi.mocked(formsApi.submissions).mockRejectedValueOnce(new Error("offline"));
    await expect(
      exportFormResponses(
        "business",
        form,
        {},
        copy,
        new AbortController().signal,
        vi.fn(),
      ),
    ).rejects.toThrow("offline");
    const controller = new AbortController();
    controller.abort();
    await expect(
      exportFormResponses(
        "business",
        form,
        {},
        copy,
        controller.signal,
        vi.fn(),
      ),
    ).rejects.toThrow();
    expect(downloadBlob).not.toHaveBeenCalled();
  });
});
