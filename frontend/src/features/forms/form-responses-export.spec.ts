import { beforeEach, describe, expect, it, vi } from "vitest";
import { formsApi } from "./api";
import { downloadBlob } from "@/lib/utils/download";
import {
  exportFormResponses,
  exportResponsePages,
  formResponsesCsv,
} from "./form-responses-export";
import { formsCopy } from "./forms-copy";
import { createForm } from "./forms-model";
import type { FormSubmission } from "./types";
import { formResponsesTable } from "./form-responses-table";

vi.mock("./api", () => ({ formsApi: { submissions: vi.fn(), get: vi.fn() } }));
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
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(formsApi.get).mockResolvedValue(form);
});
describe("form CSV export", () => {
  it("uses the same safe exporter with only dates and answers for shared clients", async () => {
    const table = formResponsesTable(form, [response], copy, [], true);
    expect(table.headers).toEqual(["created_time_utc", "Name", "Phone"]);
    expect(table.rows[0]).toEqual([
      new Date(response.createdAt),
      response.answers[0].value,
      response.answers[1].value,
    ]);
    const readPage = vi
      .fn()
      .mockResolvedValue({
        items: [response],
        total: 1,
        snapshotAt: "2026-10-20T12:00:00Z",
      });
    await exportResponsePages({
      definition: form,
      filters: { q: "customer", from: "2026-10-01", to: "2026-10-20" },
      copy,
      signal: new AbortController().signal,
      onProgress: vi.fn(),
      essential: true,
      readPage,
    });
    expect(readPage).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ q: "customer", pageSize: 100 }),
    );
    expect(downloadBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      "contact-responses-2026-10-01-to-2026-10-20.csv",
    );
  });
  it("exports immutable product quantities and prices in dedicated columns, including removed products", () => {
    const answer = {
      questionId: "products",
      label: "Materials",
      value: "Cement: 8 bag × 7 USD = 56 USD",
      products: {
        currency: "USD" as const,
        items: [
          {
            id: "removed",
            name: "=Cement",
            unit: "bag",
            quantity: 8,
            unitPrice: 7,
            lineTotal: 56,
          },
        ],
        total: 56,
      },
    };
    const row = { ...response, answers: [answer] };
    const table = formResponsesTable(form, [row], copy);
    expect(table.rows[0][table.headers.indexOf("Materials / currency")]).toBe(
      "USD",
    );
    expect(table.rows[0][table.headers.indexOf("Materials / total")]).toBe(56);
    expect(
      table.rows[0][table.headers.indexOf("Materials / =Cement / quantity")],
    ).toBe(8);
    expect(
      table.rows[0][table.headers.indexOf("Materials / =Cement / unitPrice")],
    ).toBe(7);
    expect(
      table.rows[0][table.headers.indexOf("Materials / =Cement / lineTotal")],
    ).toBe(56);
    expect(formResponsesCsv(form, [row], copy)).toContain("'=Cement");
    const discounted = { ...row, answers: [{ ...answer, products: { ...answer.products, total: 52, items: [{ ...answer.products.items[0], unitPrice: 6.5, lineTotal: 52, baseUnitPrice: 7, discount: 4, priceBreakMinimum: 5 }] } }] };
    const discountedTable = formResponsesTable(form, [discounted], copy);
    for (const [field, value] of [["baseUnitPrice", 7], ["discount", 4], ["priceBreakMinimum", 5]] as const) {
      expect(discountedTable.rows[0][discountedTable.headers.indexOf(`Materials / =Cement / ${field}`)]).toBe(value);
    }

  });
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
    expect(csv).toContain('"newsletter","form_submit","launch"');
    expect(csv).toContain('"15","Accepted","2026-10","2"');
    expect(csv.endsWith("\r\n")).toBe(true);
  });
  it("uses reference-style metadata first, unique answer columns last, and leaves unknown attribution blank", () => {
    const table = formResponsesTable(form, [response], copy, [
      {
        id: "name",
        type: "short",
        label: "Name",
        required: false,
        options: [],
      },
      {
        id: "optional",
        type: "short",
        label: "Name",
        required: false,
        options: [],
      },
    ]);
    expect(table.headers.slice(0, 5)).toEqual([
      "response_id",
      "created_time_utc",
      "form_id",
      "form_name",
      "form_url",
    ]);
    expect(table.headers.slice(-3)).toEqual([
      "Name",
      "Name (optional)",
      "Phone",
    ]);
    expect(table.rows[0][table.headers.indexOf("device")]).toBeNull();
    expect(table.rows[0].at(-2)).toBeNull();
    expect(table.headers).not.toContain("ad_id");
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
        { q: "customer", from: "2026-10-01", to: "2026-10-10" },
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
          to: "2026-10-10",
          pageSize: 100,
          before: "2026-10-10T12:00:00Z",
        },
      );
      expect(progress).toHaveBeenLastCalledWith(101, 101);
      expect(downloadBlob).toHaveBeenCalledWith(
        expect.any(Blob),
        "contact-responses-2026-10-01-to-2026-10-10.csv",
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
