import { expect, it } from "vitest";
import {
  whatsAppTextTable,
  closeWhatsAppCodeBlock,
  parseWhatsAppTextTable,
} from "./form-whatsapp-text-table";
import { formWhatsAppProductCopy } from "./form-whatsapp-product-copy";
import { formWhatsAppMockSubmission } from "./form-whatsapp-example";
import {
  defaultFormWhatsAppDetails,
  submissionWhatsAppMessage,
} from "./form-submission-whatsapp";

it.each(["en", "ckb", "ar"] as const)(
  "keeps mixed-language cells and numeric columns isolated in %s",
  (language) => {
    const table = whatsAppTextTable(formWhatsAppProductCopy(language).headers, [
      ["Rose گوڵ زهرة", "2", "1,500 IQD", "3,000 IQD"],
    ]);
    expect(table.startsWith("```\n")).toBe(true);
    expect(table.endsWith("\n```")).toBe(true);
    expect(table).toContain("\u2068Rose گوڵ زهرة\u2069");
    expect(table).toContain("\u20681,500 IQD\u2069");
    expect(table.match(/\u2068/g)?.length).toBe(table.match(/\u2069/g)?.length);
    for (const line of table.split("\n").filter((line) => line.includes("|")))
      expect(line.split("|")).toHaveLength(4);
  },
);
it.each(["en", "ckb", "ar"] as const)(
  "recovers complete %s cells for a fitted preview, including wrapped mixed names",
  (language) => {
    const headers = formWhatsAppProductCopy(language).headers;
    const rows = [
      ["Natural flowers گوڵی سروشتی زهور طبيعية", "2 box", "1,500 IQD", "3,000 IQD"],
      ["Rose", "1", "10 USD", "10 USD"],
    ];
    const text = whatsAppTextTable(headers, rows).slice(3, -3);
    expect(parseWhatsAppTextTable(text)).toEqual({
      headers: headers.map((header) => header.replace(/\n/g, " ")),
      rows,
    });
  },
);
it("leaves ordinary or incomplete code blocks as text", () => {
  expect(parseWhatsAppTextTable("Product | Qty\n---+---\nRose | 2")).toBeNull();
  expect(parseWhatsAppTextTable("<script>alert('x')</script>")).toBeNull();
  expect(parseWhatsAppTextTable("\u200e\u2068Product\u2069|\u2068Qty\u2069\n---+---\npartial")).toBeNull();
});
it("keeps product text from injecting extra columns or closing the monospace block", () => {
  const table = whatsAppTextTable(
    ["Product", "Qty", "Price", "Total"],
    [["A|B ``` گوڵ", "2", "1,500 IQD", "3,000 IQD"]],
  );
  expect(table.match(/```/g)).toHaveLength(2);
  expect(table).toContain("A｜B ˋˋˋ گوڵ");
  expect(closeWhatsAppCodeBlock("```\npartial").match(/```/g)).toHaveLength(2);
});
it.each(["en", "ckb", "ar"] as const)(
  "puts city after the product table and total by default in %s",
  (language) => {
    const sample = formWhatsAppMockSubmission(language);
    const city = sample.answers.find((answer) => answer.questionId === "city")!;
    const message = submissionWhatsAppMessage(sample, language);
    expect(message.indexOf(city.value)).toBeGreaterThan(
      message.lastIndexOf("```"),
    );
    expect(message.indexOf(city.value)).toBeGreaterThan(
      message.indexOf(defaultFormWhatsAppDetails(language).totalLabel),
    );
  },
);
it("uses the requested Kurdish receipt wording and actual sample values", () => {
  const message = submissionWhatsAppMessage(
    formWhatsAppMockSubmission("ckb"),
    "ckb",
  );
  expect(message).toMatch(/^سڵاو بەڕێز اسماعیل دڵشاد،\n\n/);
  expect(message).toContain(
    "داواکارییەکەت بە سەرکەوتوویی تۆمار کراو بەزووترین کات دەگاتە دەستت..",
  );
  expect(message).toContain("وردەکارییەکانی داواکارییەکەت:\n\nبەرهەمەکان :");
  expect(message).toContain("گوڵی سروشتی");
  expect(message.replace(/\u00a0/g, " ")).toContain(
    "کۆی گشتی: IQD 3,000\nشار: هەولێر\n\nسوپاس بۆ متمانەت.",
  );
});
