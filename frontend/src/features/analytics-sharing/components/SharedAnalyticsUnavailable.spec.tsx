import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SharedAnalyticsUnavailable } from "./SharedAnalyticsUnavailable";
import { sharingCopy } from "../sharing-copy";

describe.each(["en", "ar", "ckb"] as const)(
  "unavailable share (%s)",
  (locale) => {
    it("explains that the link is unavailable in the tenant sign-in shell", () => {
      const copy = sharingCopy(locale);
      render(
        <SharedAnalyticsUnavailable
          locale={locale}
          branding={{
            name: "Acme",
            logo: null,
            favicon: null,
            accentColor: "#14b8a6",
            businessTenant: true,
          }}
        />,
      );
      expect(
        screen.getByRole("heading", { name: copy.unavailableTitle }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(
        screen.getByRole("main").style.getPropertyValue("--theme-primary"),
      ).toBe("#14b8a6");
      expect(
        screen
          .getAllByRole("link", { name: copy.back })
          .every((link) => link.getAttribute("href") === "/"),
      ).toBe(true);
    });
  },
);
