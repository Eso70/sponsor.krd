import { describe, expect, it } from "vitest";
import {
  formWhatsAppCopy,
  submissionWhatsAppDraft,
} from "./form-submission-whatsapp";
import type { FormSubmission } from "./types";

const response: FormSubmission = {
  id: "response",
  createdAt: "2026-11-01T00:00:00Z",
  revision: 1,
  consent: true,
  answers: [
    { questionId: "name", label: "Name", value: "Sara & Ali" },
    { questionId: "phone", label: "Phone", value: "+9647501234567" },
    {
      questionId: "request",
      label: "Request",
      value: "Delivery tomorrow? Yes & thank you",
    },
    { questionId: "region", label: "Region", value: '["Iraq","Erbil"]' },
  ],
};

describe("submission WhatsApp confirmation", () => {
  it("fills custom templates literally, without reinterpreting customer-supplied placeholders", () => {
    const draft = submissionWhatsAppDraft(
      {
        ...response,
        answers: response.answers.map((answer) =>
          answer.questionId === "name"
            ? { ...answer, value: "$& {{details}}" }
            : answer,
        ),
      },
      "en",
      "Thank you {{name}}\n{{details}}",
    )!;
    expect(draft.message).toContain("Thank you $& {{details}}");
    expect(draft.message).toContain("Delivery tomorrow?");
    expect(draft.message).not.toContain(formWhatsAppCopy("en").received);
  });
  it.each(["en", "ckb", "ar"] as const)(
    "creates an editable %s draft with saved name and requests",
    (locale) => {
      const before = JSON.stringify(response);
      const draft = submissionWhatsAppDraft(response, locale)!;
      expect(draft.phone).toBe("+9647501234567");
      expect(draft.message).toContain(formWhatsAppCopy(locale).received);
      expect(draft.message).toContain("Sara & Ali");
      expect(draft.message).toContain(
        "Request: Delivery tomorrow? Yes & thank you",
      );
      expect(draft.message).toContain("Region: Iraq › Erbil");
      const url = new URL(draft.href);
      expect(url.origin).toBe("https://wa.me");
      expect(url.pathname).toBe("/9647501234567");
      expect(url.searchParams.get("text")).toBe(draft.message);
      expect(JSON.stringify(response)).toBe(before);
    },
  );
  it.each([
    "+447911123456",
    "+14155552671",
    "+٩٦٤٧٥٠١٢٣٤٥٦٧",
    "009647501234567",
  ])("normalizes international contact %s", (value) => {
    expect(
      submissionWhatsAppDraft(
        {
          ...response,
          answers: [
            {
              questionId: "phone",
              label: "Phone",
              questionType: "phone",
              value,
            },
          ],
        },
        "en",
      )?.phone,
    ).toMatch(/^\+[1-9]\d+$/);
  });
  it.each(["123456789012", "07501234567", "javascript:alert(1)", "+964123"])(
    "does not guess a recipient from %s",
    (value) => {
      expect(
        submissionWhatsAppDraft(
          {
            ...response,
            answers: [{ questionId: "reference", label: "Reference", value }],
          },
          "en",
        ),
      ).toBeNull();
    },
  );
  it("uses typed personal contacts and names, omitting private identity fields", () => {
    const draft = submissionWhatsAppDraft(
      {
        ...response,
        answers: [
          {
            questionId: "reference",
            label: "Reference",
            questionType: "short",
            value: "+14155552671",
          },
          {
            questionId: "work",
            label: "Work",
            questionType: "phone",
            labelKey: "workPhone",
            value: "+447911123456",
          },
          {
            questionId: "personal",
            label: "Mobile",
            questionType: "phone",
            labelKey: "phone",
            value: "+9647501234567",
          },
          {
            questionId: "first",
            label: "Custom first",
            labelKey: "firstName",
            questionType: "short",
            value: "Sara",
          },
          {
            questionId: "last",
            label: "Custom last",
            labelKey: "lastName",
            questionType: "short",
            value: "Ali",
          },
          {
            questionId: "national",
            label: "National ID number",
            value: "PRIVATE-ID",
          },
          {
            questionId: "email",
            label: "Email",
            questionType: "email",
            value: "private@example.com",
          },
        ],
      },
      "en",
    )!;
    expect(draft.phone).toBe("+9647501234567");
    expect(draft.message).toContain("Hello Sara Ali,");
    expect(draft.message).not.toContain("PRIVATE-ID");
    expect(draft.message).not.toContain("private@example.com");
  });
  it("uses saved product prices and totals rather than current form definitions", () => {
    const draft = submissionWhatsAppDraft(
      {
        ...response,
        answers: [
          ...response.answers,
          {
            questionId: "products",
            label: "Order",
            value: "",
            products: {
              currency: "IQD",
              total: 15000,
              items: [
                {
                  id: "item",
                  name: "Product",
                  unit: "box",
                  quantity: 2,
                  unitPrice: 7500,
                  lineTotal: 15000,
                  baseUnitPrice: 8000,
                },
              ],
            },
          },
        ],
      },
      "en",
    )!;
    expect(draft.message).toContain("Product");
    expect(draft.message).toContain("2 box");
    expect(draft.message).toContain("7,500");
    expect(draft.message).toContain("15,000");
    expect(draft.message).not.toContain("8,000");
  });
  it("visibly bounds very large summaries", () => {
    const draft = submissionWhatsAppDraft(
      {
        ...response,
        answers: [
          ...response.answers,
          { questionId: "long", label: "Details", value: "a".repeat(10000) },
        ],
      },
      "en",
    )!;
    expect(draft.message.length).toBeLessThan(6000);
    expect(draft.message).toContain(formWhatsAppCopy("en").remaining);
  });
});
