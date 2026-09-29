import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorPage } from "@/components/error-pages/ErrorPage";
import { businessErrorTheme } from "@/components/error-pages/error-theme";
import { parseWebsiteColor } from "@/lib/utils/parse-website-color";
import { businessErrorPageCopy } from "./error-copy";

const theme = businessErrorTheme({
  websiteColor: parseWebsiteColor("#123456"),
  favicon: null, logo: null, name: "Example", subdomain: "example",
  linktrees: [{ name: "Sample", href: "/linktree/sample" }],
});

describe("Business error copy", () => {
  it("translates business error controls to English", () => {
    const english = render(
      <ErrorPage {...businessErrorPageCopy("en", "badGateway")} theme={theme} homeHref="/" showRetry />,
    );
    expect(screen.getByRole("heading", { name: "Couldn't connect to the service" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(english.container.querySelector("main")).toHaveAttribute("lang", "en");
  });
  it("translates the full Arabic error surface and preserves Kurdish defaults", () => {
    const arabic = render(
      <ErrorPage {...businessErrorPageCopy("ar", "badGateway")} theme={theme} homeHref="/" showRetry />,
    );
    expect(screen.getByRole("heading", { name: "تعذّر الاتصال بالخدمة" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "حاول مجددًا" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "الصفحة الرئيسية" })).toBeInTheDocument();
    expect(screen.getByText("الصفحات العامة")).toBeInTheDocument();
    expect(arabic.container.querySelector("main")).toHaveAttribute("lang", "ar");
    arabic.unmount();

    render(<ErrorPage {...businessErrorPageCopy("ckb", "badGateway")} theme={theme} homeHref="/" showRetry />);
    expect(screen.getByRole("button", { name: "هەوڵ بدەوە" })).toBeInTheDocument();
  });

  it("covers published Linktree gone and inactive states", () => {
    const gone = render(<ErrorPage {...businessErrorPageCopy("ar", "gone")} theme={theme} homeHref="/" />);
    expect(screen.getByRole("heading", { name: "المحتوى لم يعد متاحًا" })).toBeInTheDocument();
    gone.unmount();
    render(<ErrorPage {...businessErrorPageCopy("ar", "inactive")} theme={theme} homeHref="/" />);
    expect(screen.getByRole("heading", { name: "هذه الصفحة معطلة" })).toBeInTheDocument();
  });
});
