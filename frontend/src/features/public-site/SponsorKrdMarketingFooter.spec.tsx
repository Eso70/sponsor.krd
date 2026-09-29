import { render, screen } from "@testing-library/react";
import { SponsorKrdMarketingFooter } from "./SponsorKrdMarketingFooter";
import { RootPublicLocaleProvider } from "./RootPublicLocaleProvider";

describe("SponsorKrdMarketingFooter", () => {
  it("renders the SponsorKrd footer with Kurdish navigation", () => {
    const { container } = render(
      <RootPublicLocaleProvider initialLocale="ckb"><SponsorKrdMarketingFooter accentColor="#25F4EE" /></RootPublicLocaleProvider>,
    );

    expect(container.querySelector("footer")).toHaveAttribute("dir", "ltr");
    expect(screen.queryByRole("navigation", { name: "Product" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "مەرجەکان" })).toHaveAttribute(
      "href",
      "/legal/terms",
    );
    expect(screen.getByText(/هەموو مافەکان پارێزراون$/)).toBeInTheDocument();
  });

  it("renders Arabic legal navigation", () => {
    render(<RootPublicLocaleProvider initialLocale="ar"><SponsorKrdMarketingFooter accentColor="#25F4EE" /></RootPublicLocaleProvider>);
    expect(screen.getByRole("link", { name: "شروط الاستخدام" })).toHaveAttribute("href", "/legal/terms");
    expect(screen.getByRole("link", { name: "سياسة الخصوصية" })).toHaveAttribute("href", "/legal/privacy");
  });
});
