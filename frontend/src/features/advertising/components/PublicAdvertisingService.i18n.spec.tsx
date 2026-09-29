import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AdvertisingServiceConfig } from "../types";
import { PublicAdvertisingService } from "./PublicAdvertisingService";
import { PublicVideoCodePage } from "./PublicVideoCodePage";

const config: AdvertisingServiceConfig = {
  status: "published",
  sections: { hero: true, journey: false, results: false, packages: true, testimonials: false, faq: false, closingCta: false },
  title: "Business-written title",
  description: "Business-written description",
  whatsappNumber: "9647501234567",
  packageCategories: [],
  packageTiers: { personal: [{ id: "tier-1", price: 10000, views: "1000" }], business: [] },
  results: [], testimonials: [], faqs: [],
  closingCta: { title: "", description: "", buttonLabel: "" },
  videoUrl: "", videoTutorialTitle: "Owner's video guide", tutorialSteps: [], paymentProviders: [],
};

describe("public business advertising language", () => {
  it("changes application text without changing stored business content", () => {
    render(<PublicAdvertisingService branding={{ name: "Example business" }} config={config} initialLocale="ckb" />);
    expect(screen.getByRole("heading", { name: "نرخی سپۆنسەر" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "گۆڕینی زمان بۆ عەرەبی" }));
    expect(screen.getByRole("heading", { name: "أسعار الإعلانات" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "لصورك أو فيديوهاتك" })).toBeInTheDocument();
    expect(screen.getByText("Business-written description")).toBeInTheDocument();
  });

  it("uses the saved visitor language on the video guide", () => {
    render(<PublicVideoCodePage branding={{ name: "Example business" }} config={config} initialLocale="ar" />);
    expect(screen.getByRole("link", { name: "العودة إلى صفحة الإعلانات" })).toBeInTheDocument();
    expect(screen.getByText("Owner's video guide")).toBeInTheDocument();
    expect(screen.getByText("لم يُضف فيديو بعد")).toBeInTheDocument();
  });
});
