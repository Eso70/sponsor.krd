import { render, screen } from "@testing-library/react";
import { RootPublicLocaleProvider } from "./RootPublicLocaleProvider";
import { RootLegalDocument } from "./RootLegalDocument";

describe("root legal documents", () => {
  it("shows the privacy contact, preview disclosure, and English reading direction", () => {
    render(
      <RootPublicLocaleProvider initialLocale="en">
        <RootLegalDocument kind="privacy" version="2026-10-09" />
      </RootPublicLocaleProvider>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute(
      "dir",
      "ltr",
    );
    expect(
      screen.getByRole("link", { name: "esma3ildilshad04x@gmail.com" }),
    ).toHaveAttribute("href", "mailto:esma3ildilshad04x@gmail.com");
    expect(
      screen.getByText(
        /does not publish forms, store responses, or send leads/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/not permission for unrelated marketing/),
    ).toBeInTheDocument();
  });
  it("shows the Arabic terms and matching legal footer", () => {
    render(
      <RootPublicLocaleProvider initialLocale="ar">
        <RootLegalDocument kind="terms" version="2026-08-19" />
      </RootPublicLocaleProvider>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "شروط الاستخدام" }),
    ).toHaveAttribute("lang", "ar");
    expect(
      screen.getByRole("heading", { name: "1. القبول" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "سياسة الخصوصية" }),
    ).toHaveAttribute("href", "/legal/privacy");
  });

  it("shows the Arabic privacy text", () => {
    render(
      <RootPublicLocaleProvider initialLocale="ar">
        <RootLegalDocument kind="privacy" version="2026-08-19" />
      </RootPublicLocaleProvider>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "سياسة الخصوصية" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "3. المشاركة" }),
    ).toBeInTheDocument();
  });
});
