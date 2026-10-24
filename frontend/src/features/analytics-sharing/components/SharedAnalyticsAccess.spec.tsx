import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SharedAnalyticsAccess } from "./SharedAnalyticsAccess";
import { sharingCopy } from "../sharing-copy";
import {
  AUTHENTICATION_CODE_INPUT_CLASS,
  AUTHENTICATION_SUBMIT_BUTTON_CLASS,
} from "@/components/shared/authentication-control-styles";

describe.each(["en", "ar", "ckb"] as const)(
  "shared access sign-in layout (%s)",
  (locale) => {
    it("uses the Business sign-in shell and shared authentication controls", () => {
      const change = vi.fn();
      const submit = vi.fn();
      const copy = sharingCopy(locale);
      render(
        <SharedAnalyticsAccess
          locale={locale}
          onLocaleChange={vi.fn()}
          code="001234"
          onCodeChange={change}
          busy={false}
          loading={false}
          failed={false}
          onSubmit={submit}
        />,
      );
      expect(screen.getByRole("main")).toHaveAttribute("dir", "ltr");
      expect(screen.getByRole("main")).toHaveClass("min-h-dvh", "flex-col");
      expect(screen.getByRole("main")).not.toHaveClass(
        "h-screen",
        "overflow-hidden",
      );
      expect(screen.getByRole("complementary")).toHaveClass(
        "hidden",
        "lg:flex",
      );
      expect(screen.getByRole("link", { name: copy.back })).toHaveAttribute(
        "href",
        "/",
      );
      expect(screen.getByRole("main").querySelector('[dir="rtl"]')).toBeNull();
      const input = screen.getByRole("textbox", { name: copy.code });
      expect(input.className).toBe(AUTHENTICATION_CODE_INPUT_CLASS);
      expect(input).toHaveAttribute("placeholder", "– – – – – –");
      const button = screen.getByRole("button", { name: copy.unlock });
      expect(button.className).toBe(AUTHENTICATION_SUBMIT_BUTTON_CLASS);
      fireEvent.change(input, { target: { value: "٠٠١٢٣٤" } });
      expect(change).toHaveBeenCalledWith("001234");
      fireEvent.click(button);
      expect(submit).toHaveBeenCalledOnce();
    });
  },
);

it("uses the tenant gradient, business name and neutral logo fallback", () => {
  render(
    <SharedAnalyticsAccess
      locale="en"
      onLocaleChange={vi.fn()}
      code=""
      onCodeChange={vi.fn()}
      busy={false}
      loading={false}
      failed={false}
      onSubmit={vi.fn()}
      branding={{
        name: "Acme",
        logo: null,
        favicon: null,
        accentColor: "gradient:to-r:#14b8a6:#22c55e",
        origin: "https://acme.sponsor.krd",
        businessTenant: true,
      }}
    />,
  );
  expect(
    screen.getByRole("main").style.getPropertyValue("--theme-primary"),
  ).toBe("#14b8a6");
  expect(
    screen.getByRole("main").style.getPropertyValue("--theme-css"),
  ).toContain("#22c55e");
  expect(
    screen.getByRole("img", { name: "Acme" }).getAttribute("src"),
  ).toContain("business-logo-placeholder");
  expect(screen.queryByText("Sponsor.krd")).not.toBeInTheDocument();
});
