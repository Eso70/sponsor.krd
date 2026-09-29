import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { businessMessages } from "@/features/business/i18n/messages";
import { BusinessMessagesPanel } from "./BusinessMessagesPanel";

vi.mock("./api", () => ({
  communicationRequest: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/utils/usePolling", () => ({
  usePolling: vi.fn(),
}));

describe("BusinessMessagesPanel language", () => {
  it("shows the empty conversation state in Arabic", async () => {
    render(
      <NextIntlClientProvider locale="ar" messages={businessMessages.ar}>
        <BusinessMessagesPanel />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("status", { name: "جارٍ تحميل الرسائل" })).toBeInTheDocument();
    expect(await screen.findByText("لا توجد رسائل")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "رسالة جديدة" })).toBeInTheDocument();
  });
});
